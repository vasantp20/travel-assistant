// src/scripts/seedLocations.js
const mongoose = require('mongoose');
const LocationMetadata = require('../models/LocationMetadata'); // Path to your schema

// Seed data covering all major Indian tourist destinations and hubs
const seedData = [
  {
    destination: "goa",
    region: "India",
    state: "Goa",
    coastalOrientation: "West",
    geographicalGuardrails: [
      "Sunrises are on the opposite side of the coast line. Do not generate itinerary items for watching a beach-line sunrise on the West Coast.",
      "Sunrises are only viewable cleanly from inland rivers (e.g., Mandovi River cruises) or high-altitude hilltop structures (e.g., Chapora Fort).",
      "Sunsets are directly viewable along all major West Coast beach lines (e.g., Baga, Calangute, Anjuna)."
    ],
    logisticalConstraints: {
      primaryAirportCode: "GOI",
      primaryAirportToCenterKm: 30,
      recommendedLocalTransit: ["rented self-drive scooter", "local taxi prepaid counter"]
    },
    commonsenseRules: [
      "App-based aggregators like Uber and Ola do not operate in this state due to local taxi union regulations.",
      "South Goa and North Goa are separated by roughly a 1.5 to 2-hour drive; avoid cross-booking activities across both zones in a single afternoon."
    ],
    isVerified: true
  },
  {
    destination: "bengaluru",
    region: "India",
    state: "Karnataka",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Kempegowda International Airport (BLR) is located ~35 km north of the city center; account for 1.5-2 hours traffic buffer during peak hours."
    ],
    logisticalConstraints: {
      primaryAirportCode: "BLR",
      primaryAirportToCenterKm: 35,
      recommendedLocalTransit: ["BMTC Vayu Vajra airport bus", "Namma Metro", "app cabs"]
    },
    commonsenseRules: [
      "Heavy peak hour traffic bottlenecks between Silk Board, Whitefield, and Hebbal; schedule nearby activities together."
    ],
    isVerified: true
  },
  {
    destination: "mumbai",
    region: "India",
    state: "Maharashtra",
    coastalOrientation: "West",
    geographicalGuardrails: [
      "Marine Drive and Bandra Bandstand offer prime sunset views over the Arabian Sea.",
      "South Mumbai (Colaba, Fort) and Western Suburbs (Bandra, Juhu) require transit planning across sea link or local train."
    ],
    logisticalConstraints: {
      primaryAirportCode: "BOM",
      primaryAirportToCenterKm: 15,
      recommendedLocalTransit: ["local train", "black-and-yellow taxi", "auto-rickshaw", "metro"]
    },
    commonsenseRules: [
      "Avoid traveling in local train peak rush hours (8-10 AM, 6-8 PM) with heavy luggage.",
      "Monsoon rain waterlogging can cause temporary transit delays."
    ],
    isVerified: true
  },
  {
    destination: "delhi",
    region: "India",
    state: "Delhi",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Indira Gandhi International Airport (DEL) connects directly via Delhi Metro Airport Express to Connaught Place."
    ],
    logisticalConstraints: {
      primaryAirportCode: "DEL",
      primaryAirportToCenterKm: 16,
      recommendedLocalTransit: ["Delhi Metro", "auto-rickshaw", "app cabs"]
    },
    commonsenseRules: [
      "Monument closures: Several national museums and monuments remain closed on Mondays.",
      "Winter fog (Dec-Jan) may cause flight and train delays."
    ],
    isVerified: true
  },
  {
    destination: "chennai",
    region: "India",
    state: "Tamil Nadu",
    coastalOrientation: "East",
    geographicalGuardrails: [
      "Marina Beach and Elliot's Beach face east over the Bay of Bengal; spectacular sunrises can be viewed directly from the shoreline."
    ],
    logisticalConstraints: {
      primaryAirportCode: "MAA",
      primaryAirportToCenterKm: 18,
      recommendedLocalTransit: ["Chennai Metro", "suburban train", "prepaid taxi"]
    },
    commonsenseRules: [
      "Afternoon temperatures during peak summer (April-June) can be severe; schedule outdoor monument visits for early morning."
    ],
    isVerified: true
  },
  {
    destination: "hyderabad",
    region: "India",
    state: "Telangana",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Rajiv Gandhi International Airport (HYD) at Shamshabad is ~30 km south of the city; Pushpak airport bus connects major hubs."
    ],
    logisticalConstraints: {
      primaryAirportCode: "HYD",
      primaryAirportToCenterKm: 30,
      recommendedLocalTransit: ["Pushpak Airport bus", "Hyderabad Metro", "app cabs"]
    },
    commonsenseRules: [
      "Charminar and Laad Bazaar areas are extremely congested; best explored on foot."
    ],
    isVerified: true
  },
  {
    destination: "kolkata",
    region: "India",
    state: "West Bengal",
    coastalOrientation: "East",
    geographicalGuardrails: [
      "Situated along the east bank of the Hooghly River; Princes Ghat and Howrah Bridge offer scenic river views."
    ],
    logisticalConstraints: {
      primaryAirportCode: "CCU",
      primaryAirportToCenterKm: 17,
      recommendedLocalTransit: ["yellow taxi", "Kolkata Metro", "tram", "ferry"]
    },
    commonsenseRules: [
      "Heritage hand-pulled rickshaws and trams operate in specific historic zones."
    ],
    isVerified: true
  },
  {
    destination: "jaipur",
    region: "India",
    state: "Rajasthan",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Amer Fort, Jaigarh Fort, and Nahargarh Fort sit elevated along the Aravalli hills overlooking the city."
    ],
    logisticalConstraints: {
      primaryAirportCode: "JAI",
      primaryAirportToCenterKm: 12,
      recommendedLocalTransit: ["auto-rickshaw", "prepaid cab", "rented bike"]
    },
    commonsenseRules: [
      "Old Pink City gates have narrow lanes best explored on foot or by auto-rickshaw."
    ],
    isVerified: true
  },
  {
    destination: "udaipur",
    region: "India",
    state: "Rajasthan",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Lake Pichola, Fateh Sagar, and Swaroop Sagar dominate the cityscape; boat rides offer prime sunset views."
    ],
    logisticalConstraints: {
      primaryAirportCode: "UDR",
      primaryAirportToCenterKm: 22,
      recommendedLocalTransit: ["auto-rickshaw", "walking", "prepaid taxi"]
    },
    commonsenseRules: [
      "The Old City streets surrounding City Palace are narrow and pedestrianized; large vehicles cannot enter."
    ],
    isVerified: true
  },
  {
    destination: "kochi",
    region: "India",
    state: "Kerala",
    coastalOrientation: "West",
    geographicalGuardrails: [
      "Fort Kochi faces west towards the Arabian Sea; Chinese Fishing Nets offer quintessential sunset photography."
    ],
    logisticalConstraints: {
      primaryAirportCode: "COK",
      primaryAirportToCenterKm: 38,
      recommendedLocalTransit: ["Kochi Water Metro", "Kochi Metro", "local ferry", "auto-rickshaw"]
    },
    commonsenseRules: [
      "Water Metro ferries connect Fort Kochi, Mattancherry, and Vypin efficiently avoiding road traffic."
    ],
    isVerified: true
  },
  {
    destination: "thiruvananthapuram",
    region: "India",
    state: "Kerala",
    coastalOrientation: "West",
    geographicalGuardrails: [
      "Kovalam and Varkala cliff beaches face the Arabian Sea with prominent West Coast sunset views."
    ],
    logisticalConstraints: {
      primaryAirportCode: "TRV",
      primaryAirportToCenterKm: 6,
      recommendedLocalTransit: ["auto-rickshaw", "local KSRTC bus", "taxi"]
    },
    commonsenseRules: [
      "Padmanabhaswamy Temple enforces a strict traditional dress code (dhoti/saree)."
    ],
    isVerified: true
  },
  {
    destination: "varanasi",
    region: "India",
    state: "Uttar Pradesh",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Located on the west bank of the Ganges River; morning boat rides face east for sunrise over the river."
    ],
    logisticalConstraints: {
      primaryAirportCode: "VNS",
      primaryAirportToCenterKm: 25,
      recommendedLocalTransit: ["walking", "e-rickshaw", "row boat"]
    },
    commonsenseRules: [
      "The historic Ghats and narrow alleys (Galis) are strictly pedestrianized; arrive by 5:30 PM for Ganga Aarti at Dashashwamedh Ghat."
    ],
    isVerified: true
  },
  {
    destination: "agra",
    region: "India",
    state: "Uttar Pradesh",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Taj Mahal sits along the Yamuna River; Mehtab Bagh across the river provides behind-the-monument sunset views."
    ],
    logisticalConstraints: {
      primaryAirportCode: "AGR",
      primaryAirportToCenterKm: 8,
      recommendedLocalTransit: ["battery auto-rickshaw", "golf cart", "taxi"]
    },
    commonsenseRules: [
      "Taj Mahal is strictly closed on Fridays for general visitors."
    ],
    isVerified: true
  },
  {
    destination: "amritsar",
    region: "India",
    state: "Punjab",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Golden Temple (Sri Harmandir Sahib) is central; Wagah Border is located 30 km west near the international border."
    ],
    logisticalConstraints: {
      primaryAirportCode: "ATQ",
      primaryAirportToCenterKm: 11,
      recommendedLocalTransit: ["auto-rickshaw", "shared taxi", "walking"]
    },
    commonsenseRules: [
      "Head covering and shoe removal are mandatory before entering Golden Temple complex.",
      "Wagah Border Beating Retreat ceremony requires arriving by 3:30 PM for security seating."
    ],
    isVerified: true
  },
  {
    destination: "srinagar",
    region: "India",
    state: "Jammu and Kashmir",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Dal Lake and Nigeen Lake dominate local transport; Shikara rides and houseboats operate locally."
    ],
    logisticalConstraints: {
      primaryAirportCode: "SXR",
      primaryAirportToCenterKm: 12,
      recommendedLocalTransit: ["Shikara boat", "prebooked private cab"]
    },
    commonsenseRules: [
      "High security protocol at Srinagar Airport requires early arrival (3 hours prior to domestic flight)."
    ],
    isVerified: true
  },
  {
    destination: "leh",
    region: "India",
    state: "Ladakh",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "High altitude (3,500m above sea level); mandatory 36-48 hour acclimatization required upon arrival."
    ],
    logisticalConstraints: {
      primaryAirportCode: "IXL",
      primaryAirportToCenterKm: 5,
      recommendedLocalTransit: ["local union taxi", "rented Himalayan motorcycle"]
    },
    commonsenseRules: [
      "Inner Line Permit (ILP) required for visiting Pangong Tso, Nubra Valley, and Khardung La.",
      "Extreme temperature fluctuations between day and night."
    ],
    isVerified: true
  },
  {
    destination: "port blair",
    region: "India",
    state: "Andaman and Nicobar Islands",
    coastalOrientation: "East",
    geographicalGuardrails: [
      "Gateway to Andaman islands; Cellular Jail and Corbyn's Cove face east."
    ],
    logisticalConstraints: {
      primaryAirportCode: "IXZ",
      primaryAirportToCenterKm: 4,
      recommendedLocalTransit: ["auto-rickshaw", "prepaid taxi", "inter-island ferry"]
    },
    commonsenseRules: [
      "Ferries to Havelock/Neil island depart from Phoenix Bay / Haddo Jetty; pre-booking is essential."
    ],
    isVerified: true
  },
  {
    destination: "havelock island",
    region: "India",
    state: "Andaman and Nicobar Islands",
    coastalOrientation: "East",
    geographicalGuardrails: [
      "There are no direct flights to Havelock Island. Users must fly into Port Blair (IXZ) first.",
      "Transit to Havelock requires a private or government ferry (e.g., Makruzz, Nautika)."
    ],
    logisticalConstraints: {
      primaryAirportCode: "IXZ",
      primaryAirportToCenterKm: 60,
      recommendedLocalTransit: ["private ferry jetty", "rented scooter", "pre-booked auto-rickshaw"]
    },
    commonsenseRules: [
      "Ferry tickets must be booked well in advance during peak season.",
      "Mobile internet connectivity (4G/5G) is highly unstable across the island."
    ],
    isVerified: true
  },
  {
    destination: "darjeeling",
    region: "India",
    state: "West Bengal",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Sunrise Vantage Point: Tiger Hill is the premier spot for viewing sunrise over Mount Kanchenjunga."
    ],
    logisticalConstraints: {
      primaryAirportCode: "IXB",
      primaryAirportToCenterKm: 70,
      recommendedLocalTransit: ["shared mountain jeep", "private SUV", "toy train"]
    },
    commonsenseRules: [
      "Heavy mountain road bottlenecks require 3:30 AM departure for Tiger Hill sunrise."
    ],
    isVerified: true
  },
  {
    destination: "bagdogra",
    region: "India",
    state: "West Bengal",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Gateway airport (IXB) servicing Darjeeling, Gangtok (Sikkim), and Kalimpong hill stations."
    ],
    logisticalConstraints: {
      primaryAirportCode: "IXB",
      primaryAirportToCenterKm: 5,
      recommendedLocalTransit: ["prepaid mountain taxi", "shared jeep"]
    },
    commonsenseRules: [
      "Sikkim entry permits (Inner Line Permit) can be processed at Rangpo border checkpoint."
    ],
    isVerified: true
  },
  {
    destination: "guwahati",
    region: "India",
    state: "Assam",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Situated along the Brahmaputra River; gateway to Assam wildlife sanctuaries (Kaziranga)."
    ],
    logisticalConstraints: {
      primaryAirportCode: "GAU",
      primaryAirportToCenterKm: 22,
      recommendedLocalTransit: ["ASTC airport bus", "app cabs", "auto-rickshaw"]
    },
    commonsenseRules: [
      "Kamakhya Temple queue timings can be long; early morning visits recommended."
    ],
    isVerified: true
  },
  {
    destination: "bhubaneswar",
    region: "India",
    state: "Odisha",
    coastalOrientation: "East",
    geographicalGuardrails: [
      "Temple city of Odisha; gateway to Puri Jagannath Temple (60 km) and Konark Sun Temple (65 km)."
    ],
    logisticalConstraints: {
      primaryAirportCode: "BBI",
      primaryAirportToCenterKm: 4,
      recommendedLocalTransit: ["Mo Bus service", "auto-rickshaw", "taxi"]
    },
    commonsenseRules: [
      "Konark Sun Temple is best visited during early morning to avoid midday heat."
    ],
    isVerified: true
  },
  {
    destination: "ahmedabad",
    region: "India",
    state: "Gujarat",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Sabarmati Riverfront divides modern western city and UNESCO heritage eastern walled city."
    ],
    logisticalConstraints: {
      primaryAirportCode: "AMD",
      primaryAirportToCenterKm: 10,
      recommendedLocalTransit: ["BRTS bus", "Ahmedabad Metro", "auto-rickshaw"]
    },
    commonsenseRules: [
      "Gujarat is a dry state; alcoholic beverages require an online tourist liquor permit."
    ],
    isVerified: true
  },
  {
    destination: "pune",
    region: "India",
    state: "Maharashtra",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Cultural capital of Maharashtra; gateway to Western Ghat hill stations (Lonavala, Khandala, Mahabaleshwar)."
    ],
    logisticalConstraints: {
      primaryAirportCode: "PNQ",
      primaryAirportToCenterKm: 10,
      recommendedLocalTransit: ["Pune Metro", "PMPML bus", "auto-rickshaw", "app cabs"]
    },
    commonsenseRules: [
      "Afternoon quiet hours (1:30 PM - 4:00 PM) observed by traditional local shops in core Peth areas."
    ],
    isVerified: true
  },
  {
    destination: "chandigarh",
    region: "India",
    state: "Chandigarh",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Planned city architecture designed by Le Corbusier; gateway to Himachal Pradesh hill stations."
    ],
    logisticalConstraints: {
      primaryAirportCode: "IXC",
      primaryAirportToCenterKm: 12,
      recommendedLocalTransit: ["CTU bus", "auto-rickshaw", "app cabs"]
    },
    commonsenseRules: [
      "Strict traffic rule enforcement and speed camera monitoring across all sectors."
    ],
    isVerified: true
  },
  {
    destination: "coimbatore",
    region: "India",
    state: "Tamil Nadu",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Industrial hub and primary airport gateway to Nilgiri hill stations (Ooty, Coonoor - 85 km)."
    ],
    logisticalConstraints: {
      primaryAirportCode: "CJB",
      primaryAirportToCenterKm: 10,
      recommendedLocalTransit: ["local bus", "auto-rickshaw", "intercity taxi"]
    },
    commonsenseRules: [
      "Nilgiri hairpin bends to Ooty require cautious driving or experienced local drivers."
    ],
    isVerified: true
  },
  {
    destination: "madurai",
    region: "India",
    state: "Tamil Nadu",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Meenakshi Amman Temple dominates city layout with 4 major gopurams facing compass directions."
    ],
    logisticalConstraints: {
      primaryAirportCode: "IXM",
      primaryAirportToCenterKm: 12,
      recommendedLocalTransit: ["auto-rickshaw", "local bus", "taxi"]
    },
    commonsenseRules: [
      "Mobile phones and electronic items are strictly prohibited inside Meenakshi Temple."
    ],
    isVerified: true
  },
  {
    destination: "mangaluru",
    region: "India",
    state: "Karnataka",
    coastalOrientation: "West",
    geographicalGuardrails: [
      "Panambur and Tannirbhavi beaches face west on the Arabian Sea; ideal for West Coast sunsets."
    ],
    logisticalConstraints: {
      primaryAirportCode: "IXE",
      primaryAirportToCenterKm: 13,
      recommendedLocalTransit: ["express city bus", "auto-rickshaw", "taxi"]
    },
    commonsenseRules: [
      "Mangaluru International Airport (IXE) has a hilltop tabletop runway; expect steep descent."
    ],
    isVerified: true
  },
  {
    destination: "visakhapatnam",
    region: "India",
    state: "Andhra Pradesh",
    coastalOrientation: "East",
    geographicalGuardrails: [
      "RK Beach and Rushikonda Beach face East; sunrises viewable directly over the Bay of Bengal."
    ],
    logisticalConstraints: {
      primaryAirportCode: "VTZ",
      primaryAirportToCenterKm: 8,
      recommendedLocalTransit: ["APSRTC bus", "auto-rickshaw", "app cabs"]
    },
    commonsenseRules: [
      "INS Kurusura Submarine Museum is closed on Mondays."
    ],
    isVerified: true
  },
  {
    destination: "indore",
    region: "India",
    state: "Madhya Pradesh",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Cleanest city in India; famous Sarafa Night Food Market operates in jewellery street after 8 PM."
    ],
    logisticalConstraints: {
      primaryAirportCode: "IDR",
      primaryAirportToCenterKm: 8,
      recommendedLocalTransit: ["iBus BRTS", "e-rickshaw", "auto-rickshaw"]
    },
    commonsenseRules: [
      "Strict waste segregation guidelines enforced at public places."
    ],
    isVerified: true
  },
  {
    destination: "dehradun",
    region: "India",
    state: "Uttarakhand",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Jolly Grant Airport (DED) serves as the primary air gateway to Rishikesh (21 km), Haridwar (38 km), and Mussoorie (60 km)."
    ],
    logisticalConstraints: {
      primaryAirportCode: "DED",
      primaryAirportToCenterKm: 25,
      recommendedLocalTransit: ["intercity cab", "auto-rickshaw", "shared bus"]
    },
    commonsenseRules: [
      "Triveni Ghat Ganga Aarti in Rishikesh starts around 6:00 PM; arrive early for seating."
    ],
    isVerified: true
  },
  {
    destination: "kullu",
    region: "India",
    state: "Himachal Pradesh",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Bhuntar Airport (KUU) in Kullu valley serves Manali (50 km north) and Solang Valley."
    ],
    logisticalConstraints: {
      primaryAirportCode: "KUU",
      primaryAirportToCenterKm: 10,
      recommendedLocalTransit: ["mountain taxi", "HRTC bus"]
    },
    commonsenseRules: [
      "Rohtang Pass permits are limited and must be booked online in advance."
    ],
    isVerified: true
  },
  {
    destination: "khajuraho",
    region: "India",
    state: "Madhya Pradesh",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Famous UNESCO World Heritage temple complexes grouped into Western, Eastern, and Southern sets."
    ],
    logisticalConstraints: {
      primaryAirportCode: "HJR",
      primaryAirportToCenterKm: 4,
      recommendedLocalTransit: ["auto-rickshaw", "bicycle", "walking"]
    },
    commonsenseRules: [
      "Western Group of Temples light and sound show operates every evening in English & Hindi."
    ],
    isVerified: true
  },
  {
    destination: "jodhpur",
    region: "India",
    state: "Rajasthan",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Mehrangarh Fort sits 125 meters above the skyline; Blue City houses surround the fort base."
    ],
    logisticalConstraints: {
      primaryAirportCode: "JDH",
      primaryAirportToCenterKm: 6,
      recommendedLocalTransit: ["auto-rickshaw", "walking", "prepaid taxi"]
    },
    commonsenseRules: [
      "Old city lanes around Clock Tower (Ghanta Ghar) are best traversed on foot or auto-rickshaw."
    ],
    isVerified: true
  },
  {
    destination: "jaisalmer",
    region: "India",
    state: "Rajasthan",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Golden Fort (Sonar Qila) is a living fort; Sam Sand Dunes are located 45 km west for desert safari."
    ],
    logisticalConstraints: {
      primaryAirportCode: "JSA",
      primaryAirportToCenterKm: 12,
      recommendedLocalTransit: ["auto-rickshaw", "desert jeep safari", "walking"]
    },
    commonsenseRules: [
      "Camel and jeep sunset safaris at Sam Dunes require pre-arranged transport."
    ],
    isVerified: true
  },
  {
    destination: "gaya",
    region: "India",
    state: "Bihar",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Bodh Gaya (12 km south of Gaya) is the UNESCO site of Gautama Buddha's enlightenment."
    ],
    logisticalConstraints: {
      primaryAirportCode: "GAY",
      primaryAirportToCenterKm: 10,
      recommendedLocalTransit: ["auto-rickshaw", "taxi", "e-rickshaw"]
    },
    commonsenseRules: [
      "Mahabodhi Temple complex requires quiet reverence and shoe removal at entrance."
    ],
    isVerified: true
  },
  {
    destination: "tirupati",
    region: "India",
    state: "Andhra Pradesh",
    coastalOrientation: "None",
    geographicalGuardrails: [
      "Tirumala Venkateswara Temple is located atop Tirumala Hills (22 km uphill from Tirupati town)."
    ],
    logisticalConstraints: {
      primaryAirportCode: "TIR",
      primaryAirportToCenterKm: 15,
      recommendedLocalTransit: ["APSRTC ghat bus", "prepaid taxi"]
    },
    commonsenseRules: [
      "Special Darshan tickets must be booked online well in advance via TTD portal."
    ],
    isVerified: true
  }
];

async function seedDatabase() {
  const MONGO_URI = process.env.MONGODB_URI;
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);

    console.log('Clearing old metadata or prepping bulk write...');
    
    // Using bulkWrite to upsert cleanly without breaking existing data
    const ops = seedData.map(doc => ({
      updateOne: {
        filter: { destination: doc.destination },
        update: { $set: doc },
        upsert: true
      }
    }));

    const result = await LocationMetadata.bulkWrite(ops);
    console.log(`Success! Upserted ${result.upsertedCount || 0} new documents and updated ${result.modifiedCount || 0} existing ones.`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  }
}

seedDatabase();