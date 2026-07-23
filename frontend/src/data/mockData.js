export const MOCK_ANALYTICS = {
  weeklyScans: [
    { day: "Mon", scans: 45, healthy: 32, diseased: 13 },
    { day: "Tue", scans: 62, healthy: 48, diseased: 14 },
    { day: "Wed", scans: 78, healthy: 55, diseased: 23 },
    { day: "Thu", scans: 95, healthy: 70, diseased: 25 },
    { day: "Fri", scans: 110, healthy: 82, diseased: 28 },
    { day: "Sat", scans: 85, healthy: 68, diseased: 17 },
    { day: "Sun", scans: 64, healthy: 50, diseased: 14 }
  ],
  diseaseDistribution: [
    { name: "Potato Early Blight", count: 48, color: "#FF5B5B" },
    { name: "Tomato Bacterial Spot", count: 32, color: "#FFC857" },
    { name: "Healthy Foliage", count: 120, color: "#28C76F" },
    { name: "Corn Common Rust", count: 24, color: "#7C5CFF" },
    { name: "Apple Scab", count: 18, color: "#00B8FF" }
  ],
  accuracyTrend: [
    { week: "W1", accuracy: 96.2, latency: 140 },
    { week: "W2", accuracy: 97.5, latency: 125 },
    { week: "W3", accuracy: 98.1, latency: 110 },
    { week: "W4", accuracy: 98.4, latency: 98 }
  ],
  cropHealthRadar: [
    { crop: "Potato", health: 85, scans: 140 },
    { crop: "Tomato", health: 78, scans: 195 },
    { crop: "Corn", health: 92, scans: 88 },
    { crop: "Apple", health: 89, scans: 64 },
    { crop: "Grape", health: 94, scans: 52 }
  ]
};

export const MOCK_KNOWLEDGE_BASE = [
  {
    id: "kb-1",
    title: "Potato Early Blight",
    latin: "Alternaria solani",
    category: "fungal",
    crop: "Solanum tuberosum (Potato)",
    severity: "High",
    severityType: "critical",
    spread: "Airborne Spores & Rain Splashing",
    symptoms: "Concentric target-like rings on lower leaves, yellowing margins, premature foliage defoliation.",
    organicTreatment: "Neem oil foliage spray (2%), bio-fungicide Bacillus subtilis strain QST 713.",
    chemicalTreatment: "Copper Hydroxide 50% WP or Chlorothalonil 75% WP sprayed at 7-10 day intervals.",
    prevention: "3-year field crop rotation, drip irrigation to keep canopy dry, wide seed spacing (40cm+).",
    image: "https://images.unsplash.com/photo-1592417817098-8f3d6eb231fc?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: "kb-2",
    title: "Tomato Bacterial Spot",
    latin: "Xanthomonas perforans",
    category: "bacterial",
    crop: "Solanum lycopersicum (Tomato)",
    severity: "High",
    severityType: "critical",
    spread: "Contaminated Seeds & Splashing Water",
    symptoms: "Dark water-soaked leaf spots, yellow halos, leaf drop, pitted scabby fruit lesions.",
    organicTreatment: "Liquid copper octanoate or Serenade Garden bio-fungicide application.",
    chemicalTreatment: "Copper sulfate bactericide blended with Mancozeb formulation.",
    prevention: "Use certified pathogen-free seeds, avoid overhead watering, disinfect tools with 70% ethanol.",
    image: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: "kb-3",
    title: "Healthy Foliage Sample",
    latin: "Optima Plant Health",
    category: "healthy",
    crop: "Multi-Crop Reference",
    severity: "None",
    severityType: "healthy",
    spread: "N/A (Healthy Crop State)",
    symptoms: "Vibrant green chlorophyll color, clean cell walls, no necrotic lesions or chlorosis.",
    organicTreatment: "Balanced organic NPK compost tea feed.",
    chemicalTreatment: "No chemical intervention needed.",
    prevention: "Maintain routine soil pH (6.0 - 6.8), adequate sunlight, and scheduled drip irrigation.",
    image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: "kb-4",
    title: "Corn Common Rust",
    latin: "Puccinia sorghi",
    category: "fungal",
    crop: "Zea mays (Corn)",
    severity: "Medium",
    severityType: "warning",
    spread: "Windborne Urediniospores",
    symptoms: "Cinnamon-brown pustules on both upper and lower leaf surfaces, yellow foliage streaking.",
    organicTreatment: "Sulfur dust spray, systemic Trichoderma harzianum bio-agent.",
    chemicalTreatment: "Azoxystrobin or Propiconazole triazole fungicide.",
    prevention: "Plant resistant hybrid corn varieties, manage high humidity in field rows.",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: "kb-5",
    title: "Apple Scab",
    latin: "Venturia inaequalis",
    category: "fungal",
    crop: "Malus domestica (Apple)",
    severity: "High",
    severityType: "critical",
    spread: "Overwintering Leaf Debris Spores",
    symptoms: "Olive-green velvet leaf spots, corky brown scabs on fruit skin, leaf distortion.",
    organicTreatment: "Lime sulfur foliage wash, potassium bicarbonate sprays.",
    chemicalTreatment: "Myclobutanil or Captan 80 WDG application post-petal fall.",
    prevention: "Rake and burn fallen winter leaf litter, prune tree canopy for solar exposure.",
    image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&auto=format&fit=crop&q=60"
  },
  {
    id: "kb-6",
    title: "Grape Black Rot",
    latin: "Guignardia bidwellii",
    category: "fungal",
    crop: "Vitis vinifera (Grape)",
    severity: "High",
    severityType: "critical",
    spread: "Ascospores & Rain Drops",
    symptoms: "Reddish-brown leaf spots with dark borders, shriveled black mummified berries.",
    organicTreatment: "Bordeaux mixture spray during early shoot growth.",
    chemicalTreatment: "Mancozeb or tebuconazole application from pre-bloom to 4 weeks post-bloom.",
    prevention: "Prune and destroy mummified fruit clusters during winter dormancy.",
    image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800&auto=format&fit=crop&q=60"
  }
];

export const MOCK_FAQS = [
  {
    id: "faq-1",
    category: "Model & AI Accuracy",
    question: "What is the neural model architecture and diagnostic precision?",
    answer: "Our deep learning pathomics engine utilizes a custom PyTorch Convolutional Neural Network trained on over 54,000 high-resolution agricultural foliage images. It delivers 98.4% top-1 accuracy across 38 distinct crop disease classes."
  },
  {
    id: "faq-2",
    category: "Image Capture Best Practices",
    question: "How should I photograph leaf samples for optimal diagnostic results?",
    answer: "For maximum diagnostic confidence: capture a clear, well-lit closeup of the affected foliage area against a neutral background. Ensure focus is sharp on necrotic spots, lesions, or discolorations, avoiding harsh shadows."
  },
  {
    id: "faq-3",
    category: "Agronomic Recommendations",
    question: "How are treatment protocols and chemical controls generated?",
    answer: "Each diagnostic report matches verified pathogen signatures against standard agronomic pathology guidelines. Recommendations provide both organic biological controls and licensed chemical formulations."
  },
  {
    id: "faq-4",
    category: "PDF Export & Enterprise Reports",
    question: "Can I download and share diagnostic reports with agronomists?",
    answer: "Yes, every diagnostic scan generates an instant, downloadable PDF report complete with confidence metrics, severity ratings, pathogen vector analysis, and step-by-step treatment protocols."
  }
];
