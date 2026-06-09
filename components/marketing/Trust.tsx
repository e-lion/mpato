export function Trust() {
  const stats: [string, string][] = [
    ["12,400+", "Active merchants"],
    ["KES 3.8B", "Processed yearly"],
    ["47", "Counties"],
    ["4.8/5", "Merchant rating"],
  ];
  return (
    <section className="trust">
      <div className="wrap trust-in">
        <span className="lbl">Trusted by shops across Kenya</span>
        {stats.map(([n, c], i) => (
          <div className="stat" key={i}>
            <div className="n num">{n}</div>
            <div className="c">{c}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
