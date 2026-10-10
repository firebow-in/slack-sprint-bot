export const printReport = (groupedResults: Record<string, any[]>) => {
  console.log("\n📊 Weekly Sprint Report\n");

  const getStatus = (completion: number | null): string => {
    if (completion === null) return "❌ No Report ";
    if (completion === 100) return "✅ Done      ";
    return "⚠ In Progress";
  };

  const dates = Object.keys(groupedResults).sort().reverse();

  for (const date of dates) {
    console.log(`========================================`);
    console.log(`📅 Sprint: ${date}`);
    console.log(`========================================\n`);

    const results = groupedResults[date];

    const total = results.length;
    const reported = results.filter((r) => r.completion !== null).length;
    const missing = total - reported;

    console.log(`Total Developers: ${total}`);
    console.log(`Reported: ${reported} | Missing: ${missing}\n`);

    console.log("┌─────────────────┬──────────────┬───────────────┐");
    console.log("│ Developer       │ Completion   │ Status        │");
    console.log("├─────────────────┼──────────────┼───────────────┤");

    results.forEach((r) => {
      const name = (r.developer || "Unknown").padEnd(15);
      const completion =
        r.completion !== null ? `${r.completion}%`.padEnd(12) : "--".padEnd(12);

      const statusLabel = getStatus(r.completion);

      console.log(`│ ${name} │ ${completion} │ ${statusLabel} │`);
    });

    console.log("└─────────────────┴──────────────┴───────────────┘");

    /*
    const top = results
      .filter((r) => r.completion !== null)
      .sort((a, b) => (b.completion || 0) - (a.completion || 0))[0];
    
    if (top) {
      console.log(`\n🏆 Week's Top: ${top.developer} (${top.completion}%)`);
    }
    */

    console.log("\n");
  }
};