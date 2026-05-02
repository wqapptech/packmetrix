type Package = {
    destination: string;
    views: number;
    whatsappClicks: number;
    messengerClicks: number;
  };
  
  export function generateInsights(pkg: Package) {
    const insights: string[] = [];
  
    const totalClicks =
      (pkg.whatsappClicks || 0) + (pkg.messengerClicks || 0);
  
    const ctr = pkg.views > 0 ? totalClicks / pkg.views : 0;
  
    // 1. Low conversion
    if (ctr < 0.05 && pkg.views > 20) {
      insights.push(
        "⚠️ Low conversion rate — improve CTA visibility or urgency."
      );
    }
  
    // 2. Good performer
    if (ctr > 0.15) {
      insights.push(
        "🔥 High-performing package — replicate structure for other destinations."
      );
    }
  
    // 3. High views, low leads
    if (pkg.views > 50 && totalClicks < 5) {
      insights.push(
        "👀 High traffic but low engagement — CTA or pricing may not be clear."
      );
    }
  
    // 4. Low traffic
    if (pkg.views < 10) {
      insights.push(
        "📉 Low visibility — consider improving distribution or SEO."
      );
    }
  
    return insights;
  }