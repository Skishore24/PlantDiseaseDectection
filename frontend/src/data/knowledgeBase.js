export const KNOWLEDGE_BASE_DATA = [
  {
    id: "potato-early-blight",
    title: "Potato Early Blight",
    latin: "Alternaria solani",
    category: "fungal",
    crop: "Solanum tuberosum (Potato)",
    severity: "Medium",
    severityType: "warning",
    description: "Characterized by brown, target-like concentric spots on mature foliage. Causes severe premature defoliation and significant tuber yield reduction.",
    symptoms: [
      "Dark brown to black concentric ring spots on lower leaves",
      "Yellow halo surrounding leaf lesions",
      "Stem lesions and premature leaf drop"
    ],
    treatment: "Apply Copper Spray or Chlorothalonil every 7-14 days. Implement strict 3-year crop rotation.",
    preventative: "Ensure optimal plant spacing for air circulation, avoid overhead sprinkler irrigation, and clean equipment between fields."
  },
  {
    id: "potato-late-blight",
    title: "Potato Late Blight",
    latin: "Phytophthora infestans",
    category: "fungal",
    crop: "Solanum tuberosum (Potato)",
    severity: "Critical",
    severityType: "critical",
    description: "Water-soaked dark brown leaf lesions with white velvety mildew undersides under cool, humid conditions. Rapidly devastating pathogen.",
    symptoms: [
      "Irregular water-soaked dark spots on foliage tip/margins",
      "White fungal fuzzy growth on leaf underside during high humidity",
      "Foul odor and sudden collapse of foliage canopy"
    ],
    treatment: "Immediate systemic fungicide application (Mancozeb + Metalaxyl). Destroy severely infected plants immediately.",
    preventative: "Plant certified disease-free seed tubers, use resistant cultivars, and monitor microclimate weather alerts."
  },
  {
    id: "tomato-bacterial-spot",
    title: "Tomato Bacterial Spot",
    latin: "Xanthomonas vesicatoria",
    category: "bacterial",
    crop: "Solanum lycopersicum (Tomato)",
    severity: "High",
    severityType: "warning",
    description: "Small dark water-soaked spots with yellow halos on leaves, along with rough raised corky scabs on developing green fruit.",
    symptoms: [
      "Small 2-3mm water-soaked circular leaf spots",
      "Yellowing of foliage surrounding spots causing blighting",
      "Raised black corky spots on green tomato fruit skin"
    ],
    treatment: "Apply Copper Hydroxide combined with Mancozeb or bactericides. Remove infected crop residue post-harvest.",
    preventative: "Use disease-free seeds, avoid working in fields when foliage is wet, and drip irrigate near root bases."
  },
  {
    id: "tomato-yellow-leaf-curl",
    title: "Tomato Yellow Leaf Curl",
    latin: "TYLCV Begomovirus",
    category: "viral",
    crop: "Solanum lycopersicum (Tomato)",
    severity: "Critical",
    severityType: "critical",
    description: "Transmitted by Bemisia tabaci whiteflies. Causes severe leaf curling, chlorotic leaf margins, plant stunting, and complete blossom drop.",
    symptoms: [
      "Upward cupping and yellowing of leaf margins",
      "Stunted erect plant growth with small rigid leaves",
      "Complete failure to set fruit or severe blossom drop"
    ],
    treatment: "No direct viral cure available. Control whitefly vector populations immediately with insecticidal soaps or Neem oil.",
    preventative: "Install 50-mesh fine insect netting over greenhouses, yellow sticky traps, and weed reservoir hosts around fields."
  },
  {
    id: "healthy-foliage",
    title: "Healthy Plant Foliage",
    latin: "Normal Morphology",
    category: "healthy",
    crop: "Various Solanaceae Crops",
    severity: "Optimal",
    severityType: "healthy",
    description: "Vibrant green uniform leaf blade without chlorosis, necrosis, or pest feeding damage. Optimal photosynthetic activity and stomatal conductance.",
    symptoms: [
      "Uniform green pigmentation across entire leaf surface",
      "Turgid leaf texture without wilting or cupping",
      "Clean stems and intact leaf margins"
    ],
    treatment: "No intervention needed. Maintain routine balanced NPK fertilization and drip irrigation schedules.",
    preventative: "Regular field scouting, soil pH monitoring (6.0 - 6.8), and micronutrient foliar feeds."
  },
  {
    id: "tomato-leaf-mold",
    title: "Tomato Leaf Mold",
    latin: "Passalora fulva",
    category: "fungal",
    crop: "Solanum lycopersicum (Tomato)",
    severity: "Medium",
    severityType: "warning",
    description: "Pale green to yellow diffuse spots on upper leaf surfaces paired with olive-green velvety mold growth on the corresponding undersides.",
    symptoms: [
      "Pale green/yellow chlorotic spots on upper leaf surface",
      "Olive-green to dark brown velvety fungal patches below",
      "Leaves wither, roll up, and drop prematurely"
    ],
    treatment: "Spray Bio-Fungicide (Bacillus subtilis) or Copper-based sprays. Increase greenhouse exhaust ventilation.",
    preventative: "Keep relative humidity below 85%, space plants widely, and purge lower old leaves near the soil."
  }
];
