export const INITIAL_SHELTERS = [
  {
    id: "sh-101",
    name: "St. Jude Relief Center & High School",
    district: "Coastal Sector 4",
    address: "42 Bayview Promenade, Zone A",
    lat: 13.0827,
    lng: 80.2707,
    capacity: 450,
    occupancy: 410,
    status: "Accepting People", // "Accepting People" | "Near Capacity" | "Full" | "Evacuating"
    phone: "+91 98401 23456",
    manager: "Capt. Arvind Nair",
    inventory: [
      { id: "res-1", name: "Ready-to-Eat Food Packets", category: "Food", quantity: 620, unit: "packets", minThreshold: 300, status: "Adequate" },
      { id: "res-2", name: "Potable Drinking Water (20L)", category: "Water", quantity: 45, unit: "cans", minThreshold: 100, status: "Critical" },
      { id: "res-3", name: "Emergency Trauma Kits", category: "Medicine", quantity: 18, unit: "kits", minThreshold: 25, status: "Low" },
      { id: "res-4", name: "Thermal Blankets & Cots", category: "Bedding", quantity: 380, unit: "units", minThreshold: 400, status: "Adequate" },
      { id: "res-5", name: "Water Purification Tablets", category: "Water", quantity: 1200, unit: "strips", minThreshold: 500, status: "Surplus" }
    ]
  },
  {
    id: "sh-102",
    name: "Govt. Model Higher Secondary Campus",
    district: "Riverside Basin",
    address: "18 River Delta Road, Lowland District",
    lat: 13.0450,
    lng: 80.2200,
    capacity: 600,
    occupancy: 595,
    status: "Full",
    phone: "+91 98402 34567",
    manager: "Dr. Sunita Rao",
    inventory: [
      { id: "res-6", name: "Dry Food Rations (Rice/Pulses)", category: "Food", quantity: 120, unit: "kg", minThreshold: 500, status: "Critical" },
      { id: "res-7", name: "Potable Drinking Water (20L)", category: "Water", quantity: 180, unit: "cans", minThreshold: 150, status: "Adequate" },
      { id: "res-8", name: "Insulin & Cold-chain Meds", category: "Medicine", quantity: 12, unit: "vials", minThreshold: 30, status: "Critical" },
      { id: "res-9", name: "Foldable Canvas Beds", category: "Bedding", quantity: 580, unit: "units", minThreshold: 550, status: "Adequate" }
    ]
  },
  {
    id: "sh-103",
    name: "Community Sports Complex - North Hall",
    district: "North Sector Elevated Ridge",
    address: "9 Ring Road, Sector 8",
    lat: 13.1200,
    lng: 80.2500,
    capacity: 350,
    occupancy: 180,
    status: "Accepting People",
    phone: "+91 98403 45678",
    manager: "K. Ramanathan",
    inventory: [
      { id: "res-10", name: "Ready-to-Eat Food Packets", category: "Food", quantity: 1500, unit: "packets", minThreshold: 400, status: "Surplus" },
      { id: "res-11", name: "Potable Drinking Water (20L)", category: "Water", quantity: 320, unit: "cans", minThreshold: 100, status: "Surplus" },
      { id: "res-12", name: "First Aid & Antibiotics", category: "Medicine", quantity: 65, unit: "kits", minThreshold: 30, status: "Surplus" },
      { id: "res-13", name: "Inflatable Rafts & Life Vests", category: "Rescue", quantity: 24, unit: "sets", minThreshold: 10, status: "Surplus" }
    ]
  },
  {
    id: "sh-104",
    name: "Red Cross Disaster Transit Depot",
    district: "South Logistics Hub",
    address: "Central Terminal Bypass, Bay 3",
    lat: 12.9900,
    lng: 80.1900,
    capacity: 250,
    occupancy: 90,
    status: "Accepting People",
    phone: "+91 98404 56789",
    manager: "Maria Joseph",
    inventory: [
      { id: "res-14", name: "Emergency Food Rations", category: "Food", quantity: 800, unit: "kg", minThreshold: 200, status: "Surplus" },
      { id: "res-15", name: "Heavy Duty Tarpaulins", category: "Bedding", quantity: 450, unit: "sheets", minThreshold: 100, status: "Surplus" },
      { id: "res-16", name: "Infant Baby Formula", category: "Food", quantity: 95, unit: "tins", minThreshold: 40, status: "Adequate" },
      { id: "res-17", name: "Diesel Power Generators (5kW)", category: "Equipment", quantity: 6, unit: "units", minThreshold: 3, status: "Adequate" }
    ]
  }
];

export const INITIAL_RESOURCE_REQUESTS = [
  {
    id: "req-8901",
    idempotencyKey: "idem-req-8901-initial",
    fromShelterId: "sh-103",
    toShelterId: "sh-102",
    resourceName: "Dry Food Rations (Rice/Pulses)",
    category: "Food",
    quantity: 300,
    unit: "kg",
    urgency: "Critical",
    status: "pending", // "pending" | "in_transit" | "delivered" | "rejected"
    requestedBy: "Dr. Sunita Rao (Manager)",
    timestamp: "12 mins ago",
    notes: "Food stocks below 2 days buffer for 595 evacuees. Immediate transfer requested."
  },
  {
    id: "req-8902",
    idempotencyKey: "idem-req-8902-initial",
    fromShelterId: "sh-104",
    toShelterId: "sh-101",
    resourceName: "Potable Drinking Water (20L)",
    category: "Water",
    quantity: 80,
    unit: "cans",
    urgency: "Critical",
    status: "in_transit",
    requestedBy: "Capt. Arvind Nair (Manager)",
    timestamp: "35 mins ago",
    notes: "Water pipeline contaminated by storm surge. Truck dispatch ID #TR-402."
  },
  {
    id: "req-8903",
    idempotencyKey: "idem-req-8903-initial",
    fromShelterId: "sh-103",
    toShelterId: "sh-101",
    resourceName: "Water Purification Tablets",
    category: "Water",
    quantity: 400,
    unit: "strips",
    urgency: "Routine",
    status: "delivered",
    requestedBy: "Capt. Arvind Nair (Manager)",
    timestamp: "2 hours ago",
    notes: "Completed distribution to evacuee families."
  }
];

export const INITIAL_FIELD_REPORTS = [
  {
    id: "rep-501",
    idempotencyKey: "idem-rep-501-initial",
    author: "Officer Vikrant Patil (Team Bravo)",
    shelterId: "sh-102",
    location: "River Delta Bridge Sector 3",
    severity: "High", // "Low" | "Medium" | "High" | "Extreme"
    hazardType: "Flash Flood / Access Road Submerged",
    timestamp: "18 mins ago",
    syncedOffline: false,
    content: "River crest reached 4.2m, breaching south bund. Access road to St. Jude bypass impassable for heavy trucks. Recommend 4x4 or boat transport for medical supply replenishment."
  },
  {
    id: "rep-502",
    idempotencyKey: "idem-rep-502-initial",
    author: "Officer Ananya Sen (Medical Rapid Response)",
    shelterId: "sh-101",
    location: "Bayview Coastal Zone A",
    severity: "Extreme",
    hazardType: "Waterborne Illness Outbreak Threat",
    timestamp: "45 mins ago",
    syncedOffline: false,
    content: "Identified 14 patients with severe acute gastroenteritis. Safe water stock critical. Requesting IV fluids and ORS packets within the next 4 hours."
  },
  {
    id: "rep-503",
    idempotencyKey: "idem-rep-503-initial",
    author: "Officer Vikrant Patil (Team Bravo)",
    shelterId: "sh-104",
    location: "South Bypass Flyover Underpass",
    severity: "Medium",
    hazardType: "Displaced Persons Cluster",
    timestamp: "3 hours ago",
    syncedOffline: false,
    content: "Approx 80 unhoused individuals sheltering beneath flyover. Directed 50 to Sports Complex North Hall which has surplus capacity."
  }
];

export const ACTIVE_DISASTER_DECLARATIONS = [
  {
    id: "decl-2026-09",
    source: "Govt. Met Department / IMD SOAP Feed",
    type: "Severe Cyclonic Storm 'VAAYU'",
    warningLevel: "RED ALERT",
    affectedDistricts: ["Coastal Sector 4", "Riverside Basin", "South Estuary"],
    declaredAt: "24 Sept 2026 00:30 IST",
    windSpeed: "120-140 km/h",
    circuitBreakerStatus: "CLOSED (Healthy)", // "CLOSED" | "OPEN" | "HALF_OPEN"
    lastPoll: "2 mins ago"
  }
];

export const INITIAL_DONATIONS = [
  {
    id: "don-701",
    donorName: "Apex Logistics Foundation",
    type: "Supplies",
    items: "500 Water Cans & 200 Baby Kits",
    destination: "St. Jude Relief Center",
    date: "Today, 00:45",
    status: "Pledged / Dispatching"
  },
  {
    id: "don-702",
    donorName: "Priya V. & Friends",
    type: "Funds",
    amount: "₹ 25,000",
    transactionId: "pay_Rzp90284712",
    paymentGateway: "Razorpay (Test Mode)",
    destination: "Central Medical Relief Fund",
    date: "Yesterday, 22:15",
    status: "Verified & Deposited"
  },
  {
    id: "don-703",
    donorName: "Anand Sundaram",
    type: "Funds",
    amount: "₹ 50,000",
    transactionId: "pay_Rzp19482755",
    paymentGateway: "Razorpay (Test Mode)",
    destination: "General Disaster Relief Fund",
    date: "Yesterday, 19:30",
    status: "Verified & Deposited"
  }
];

export const USER_ROLES = [
  { id: "admin", label: "Disaster Administrator", icon: "IconShield", badge: "Command" },
  { id: "coordinator", label: "Manager / Coordinator", icon: "IconActivity", badge: "Operations" },
  { id: "field_officer", label: "Field Officer", icon: "IconRadio", badge: "Field Ops" },
  { id: "volunteer", label: "Volunteer Worker", icon: "IconUsers", badge: "Ground Relief" },
  { id: "donor", label: "Donor / Supplier", icon: "IconHeart", badge: "Aid Support" },
  { id: "public", label: "Affected People / Public", icon: "IconLifeBuoy", badge: "Public Access" }
];

export const DEMO_USERS = [
  {
    id: "usr-admin",
    name: "Dr. Rajeshwar Sharma",
    email: "admin@drc.gov.in",
    role: "admin",
    agency: "National Disaster Management Authority (NDMA)",
    phone: "+91 98111 00001",
    badgeNumber: "NDMA-DIR-01"
  },
  {
    id: "usr-coord",
    name: "Dr. Sunita Rao",
    email: "coordinator@drc.gov.in",
    role: "coordinator",
    agency: "Regional Relief Logistics Taskforce",
    phone: "+91 98402 34567",
    badgeNumber: "DRC-MGR-102"
  },
  {
    id: "usr-field",
    name: "Officer Vikrant Patil",
    email: "officer@drc.gov.in",
    role: "field_officer",
    agency: "State Rapid Medical & Rescue Unit",
    phone: "+91 98405 67890",
    badgeNumber: "DRC-FLD-501"
  },
  {
    id: "usr-vol",
    name: "Aakash Mehta",
    email: "volunteer@drc.gov.in",
    role: "volunteer",
    agency: "Youth Civic Volunteers Corps",
    phone: "+91 98406 78901",
    badgeNumber: "VOL-772"
  },
  {
    id: "usr-donor",
    name: "Meera Subramanian",
    email: "donor@drc.gov.in",
    role: "donor",
    agency: "Care & Support Philanthropic Alliance",
    phone: "+91 98407 89012"
  },
  {
    id: "usr-public",
    name: "Citizen Guest",
    email: "citizen@drc.gov.in",
    role: "public",
    phone: "+91 98408 90123"
  }
];
