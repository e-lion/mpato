import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { PAL } from "./palette";
import { KES } from "@/lib/format";
import { goodsColor, makeGoods, type Interior } from "./interior";
import { makePerson, randomLook, type Person } from "./people";
import { Tweens, easeInOut, easeOut } from "./tween";
import { walkPath } from "./walk";
import type { SaleSceneEvent } from "./bus";

type Customer = {
  person: Person;
  state: "walking" | "waiting" | "leaving";
  stop: () => void;
};

/**
 * Choreography for the point-of-sale drawer. A customer exists only while the
 * user is working a sale: they walk to the counter, goods fly off the shelves
 * as items are added, money/phone moves when paying, the shopkeeper hands over
 * the bag and the customer leaves. Nothing here spawns on a timer.
 */
export class SaleScene {
  private customer: Customer | null = null;
  private items: THREE.Object3D[] = [];
  private phone: THREE.Object3D | null = null;
  private shelfCursor = 0;
  private leaveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private room: Interior,
    private tweens: Tweens,
    private dirty: () => void,
  ) {}

  handle(e: SaleSceneEvent) {
    switch (e.type) {
      case "start":
      case "next":
        this.arrive();
        break;
      case "item":
        e.delta > 0 ? this.addItem(e.cat) : this.removeItem();
        break;
      case "paying":
        if (e.method === "mpesa") this.showPhone();
        break;
      case "payCancel":
        this.hidePhone();
        break;
      case "paid":
        this.pay(e.method, e.total);
        break;
      case "leave":
        this.dismiss(true);
        break;
    }
    this.dirty();
  }

  dispose() {
    if (this.leaveTimer) clearTimeout(this.leaveTimer);
    this.customer?.stop();
    this.customer = null;
  }

  // ---- movement ---------------------------------------------------------

  private walk(person: Person, pts: THREE.Vector3[], speed: number, done?: () => void) {
    return walkPath(this.tweens, person, pts, speed, done);
  }

  private face(person: Person, yaw: number, dur = 0.35) {
    const from = person.group.rotation.y;
    let d = yaw - from;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.tweens.add(dur, (p) => (person.group.rotation.y = from + d * p), { ease: easeInOut });
  }

  // ---- sale lifecycle ---------------------------------------------------

  private arrive() {
    if (this.customer) this.dismiss(false);
    this.clearCounter();
    const person = makePerson(randomLook());
    this.room.group.add(person.group);
    const a = this.room.anchors;
    const c: Customer = { person, state: "walking", stop: () => undefined };
    this.customer = c;
    c.stop = this.walk(person, [a.street, a.curbFar, a.curbNear, a.door, a.customer], 2.4, () => {
      c.state = "waiting";
      this.face(person, Math.PI); // face the counter (-z)
      this.face(this.room.shopkeeper, 0);
      this.greet(person);
    });
  }

  private greet(person: Person) {
    // little wave
    this.tweens.add(0.7, (p) => person.reach(Math.sin(p * Math.PI)), {
      done: () => person.reach(0),
    });
  }

  private addItem(cat?: string) {
    const a = this.room.anchors;
    const slot = a.counterSlots[this.items.length % a.counterSlots.length];
    const from = a.shelfSpots[this.shelfCursor++ % a.shelfSpots.length].clone();
    from.z = -1.75;
    const goods = makeGoods(goodsColor(cat), 0.19);
    goods.position.copy(from);
    this.room.group.add(goods);
    this.items.push(goods);
    // shopkeeper reaches while the goods arc across to the counter
    const keeper = this.room.shopkeeper;
    this.tweens.add(0.55, (p) => keeper.reach(Math.sin(p * Math.PI) * 0.9));
    this.tweens.add(
      0.6,
      (p) => {
        goods.position.lerpVectors(from, slot, p);
        goods.position.y += Math.sin(p * Math.PI) * 0.7;
        goods.rotation.y = p * Math.PI * 2;
      },
      { ease: easeInOut, done: () => goods.rotation.set(0, 0, 0) },
    );
  }

  private removeItem() {
    const g = this.items.pop();
    if (!g) return;
    const from = g.position.clone();
    const to = this.room.anchors.shelfSpots[Math.max(0, --this.shelfCursor) % this.room.anchors.shelfSpots.length];
    this.tweens.add(
      0.45,
      (p) => {
        g.position.lerpVectors(from, to, p);
        g.position.y += Math.sin(p * Math.PI) * 0.5;
        g.scale.setScalar(1 - p * 0.3);
      },
      { ease: easeInOut, done: () => this.room.group.remove(g) },
    );
  }

  private showPhone() {
    if (this.phone || !this.customer) return;
    const p = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.19, 0.02),
      new THREE.MeshStandardMaterial({ color: PAL.stone900, roughness: 0.4 }),
    );
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.085, 0.16),
      new THREE.MeshStandardMaterial({ color: PAL.mpesa, emissive: new THREE.Color(PAL.mpesa), emissiveIntensity: 0.9 }),
    );
    screen.position.z = 0.0115;
    p.add(body, screen);
    p.position.set(0.21, 1.2, 0.33);
    this.customer.person.group.add(p);
    this.phone = p;
    const person = this.customer.person;
    this.tweens.add(0.4, (k) => person.reach(k * 0.9), { ease: easeOut });
  }

  private hidePhone() {
    if (!this.phone || !this.customer) return;
    const person = this.customer.person;
    const ph = this.phone;
    this.phone = null;
    this.tweens.add(0.3, (k) => person.reach(0.9 * (1 - k)), { done: () => person.group.remove(ph) });
  }

  private pay(method: "cash" | "mpesa", total: number) {
    const c = this.customer;
    if (!c) return;
    const a = this.room.anchors;
    const tillWorld = a.tillTop.clone();
    const start = new THREE.Vector3(0.45 + 0.2, 0.85, 0.95);

    // money flies customer → till (green pings for M-PESA, gold coins for cash)
    const n = method === "cash" ? 5 : 3;
    for (let i = 0; i < n; i++) {
      const m =
        method === "cash"
          ? new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.06, 0.018, 18),
              new THREE.MeshStandardMaterial({ color: PAL.warning, emissive: new THREE.Color(PAL.warning), emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.35 }),
            )
          : new THREE.Mesh(
              new THREE.SphereGeometry(0.06, 14, 12),
              new THREE.MeshStandardMaterial({ color: PAL.mpesa, emissive: new THREE.Color(PAL.mpesa), emissiveIntensity: 1 }),
            );
      m.position.copy(start);
      this.room.group.add(m);
      this.tweens.add(
        0.7,
        (p) => {
          m.position.lerpVectors(start, tillWorld, p);
          m.position.y += Math.sin(p * Math.PI) * 0.55;
          m.rotation.x = p * 6;
        },
        { delay: i * 0.12, ease: easeInOut, done: () => { this.room.group.remove(m); } },
      );
    }
    this.hidePhone();
    this.tweens.add(0.5, (p) => c.person.reach(Math.sin(p * Math.PI)), { done: () => c.person.reach(0) });

    // till flash + floating "+KES"
    const tillDelay = 0.7 + n * 0.12;
    this.tweens.add(0.01, () => undefined, { delay: tillDelay, done: () => this.popAmount(total) });
    this.tweens.add(0.5, (p) => this.room.till.scale.setScalar(1 + Math.sin(p * Math.PI) * 0.12), { delay: tillDelay });

    // bag handed over after the till rings
    this.tweens.add(0.01, () => undefined, { delay: tillDelay + 0.3, done: () => this.handBag(c) });
  }

  private popAmount(total: number) {
    const el = document.createElement("div");
    el.className = "world3d-pop";
    el.textContent = "+" + KES(total);
    const o = new CSS2DObject(el);
    o.position.copy(this.room.anchors.tillTop).add(new THREE.Vector3(0, 0.35, 0));
    this.room.group.add(o);
    setTimeout(() => {
      this.room.group.remove(o);
      el.remove();
    }, 1700);
    this.dirty();
  }

  private handBag(c: Customer) {
    const bag = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.28, 0.14),
      new THREE.MeshStandardMaterial({ color: "#c8863e", roughness: 0.9 }),
    );
    bag.castShadow = true;
    // pack the counter goods into the bag
    const goods = this.items.splice(0);
    const a = this.room.anchors;
    const from = new THREE.Vector3(0.1, 0.78, 0.1);
    const to = new THREE.Vector3(0.45 + 0.21, 0.9, 1.15 + 0.3);
    bag.position.copy(from);
    this.room.group.add(bag);
    const keeper = this.room.shopkeeper;
    for (const g of goods) {
      const gf = g.position.clone();
      this.tweens.add(0.35, (p) => { g.position.lerpVectors(gf, from, p); g.scale.setScalar(1 - p * 0.9); }, {
        done: () => this.room.group.remove(g),
      });
    }
    this.tweens.add(0.9, (p) => keeper.reach(Math.sin(p * Math.PI)));
    this.tweens.add(
      0.8,
      (p) => {
        bag.position.lerpVectors(from, to, p);
        bag.position.y += Math.sin(p * Math.PI) * 0.15;
      },
      {
        delay: 0.4,
        ease: easeInOut,
        done: () => {
          // customer takes the bag and heads out
          c.person.group.add(bag);
          bag.position.set(0.28, 0.5, 0.18);
          this.leaveTimer = setTimeout(() => this.dismiss(false), 450);
        },
      },
    );
    void a;
  }

  private clearCounter() {
    for (const g of this.items) this.room.group.remove(g);
    this.items = [];
    this.shelfCursor = 0;
  }

  /** Customer walks back out to the street. `abandon` also clears the counter. */
  private dismiss(abandon: boolean) {
    const c = this.customer;
    if (!c || c.state === "leaving") return;
    c.state = "leaving";
    this.customer = null;
    c.stop();
    this.hidePhone();
    if (abandon) this.clearCounter();
    const a = this.room.anchors;
    const person = c.person;
    this.walk(person, [person.group.position.clone(), a.door, a.curbNear, a.curbFar, a.street.clone().setX(-1.6)], 2.6, () => {
      this.room.group.remove(person.group);
    });
    this.dirty();
  }
}
