import {
  ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Banknote, BarChart3, Bell, Box,
  Candy, Check, ChevronDown, ChevronsUpDown, Cookie, CupSoda, Download, Droplet, Ellipsis,
  Filter, Flame, LayoutDashboard, Leaf, Milk, Minus, Package, Pencil, PlayCircle, Plus,
  Printer, Receipt, Sandwich, Search, Send, Settings, ShoppingCart, Smartphone,
  Sparkles, Store, Trash2, TrendingUp, Truck, UserPlus, UserRound, Users, Wheat, X, Zap,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  "arrow-down-right": ArrowDownRight,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  banknote: Banknote,
  "bar-chart-3": BarChart3,
  bell: Bell,
  box: Box,
  candy: Candy,
  check: Check,
  "chevron-down": ChevronDown,
  "chevrons-up-down": ChevronsUpDown,
  cookie: Cookie,
  "cup-soda": CupSoda,
  download: Download,
  droplet: Droplet,
  ellipsis: Ellipsis,
  filter: Filter,
  flame: Flame,
  "layout-dashboard": LayoutDashboard,
  leaf: Leaf,
  milk: Milk,
  minus: Minus,
  package: Package,
  pencil: Pencil,
  "play-circle": PlayCircle,
  plus: Plus,
  printer: Printer,
  receipt: Receipt,
  sandwich: Sandwich,
  search: Search,
  send: Send,
  settings: Settings,
  "shopping-cart": ShoppingCart,
  smartphone: Smartphone,
  sparkles: Sparkles,
  store: Store,
  trash: Trash2,
  "trending-up": TrendingUp,
  truck: Truck,
  "user-plus": UserPlus,
  "user-round": UserRound,
  users: Users,
  wheat: Wheat,
  x: X,
  zap: Zap,
};

type Props = {
  name: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
};

export function Icon({ name, size = 18, color, style, className }: Props) {
  const C = MAP[name] ?? Box;
  return (
    <span
      className={"lic" + (className ? " " + className : "")}
      style={{ width: size, height: size, color, ...style }}
    >
      <C size={size} strokeWidth={2} />
    </span>
  );
}
