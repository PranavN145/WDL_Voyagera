const DESTINATIONS_BY_VIBE = {

  mountains: [

    {
      id: "manali",
      name: "Manali, India",
      image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=900&q=80",
      budget: "$15 - $25",
      season: "March to June",
      description: "A legendary Himalayan backpacker destination with cheap hostels, riverside cafes, bike rentals, and trekking routes.",
      tags: ["trekking", "cheap hostels", "snow", "solo"]
    },

    {
      id: "pokhara",
      name: "Pokhara, Nepal",
      image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=900&q=80",
      budget: "$12 - $20",
      season: "October to April",
      description: "Gateway to the Annapurna circuit with lakeside backpacker culture, mountain cafes, and adventure sports.",
      tags: ["hiking", "budget", "mountains", "paragliding"]
    },

    {
      id: "banff",
      name: "Banff, Canada",
      image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&q=80",
      budget: "$40 - $70",
      season: "June to September",
      description: "Turquoise lakes, alpine forests, scenic highways, and iconic Rocky Mountain trails.",
      tags: ["nature", "camping", "lakes", "roadtrip"]
    },

    {
      id: "interlaken",
      name: "Interlaken, Switzerland",
      image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&q=80",
      budget: "$50 - $90",
      season: "May to September",
      description: "A dream backpacker destination surrounded by snowy peaks and adrenaline sports.",
      tags: ["adventure", "mountains", "europe", "views"]
    }

  ],

beaches: [

  {
    id: "goa",
    name: "Goa, India",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=900&q=80",
    budget: "$10 - $18",
    season: "November to February",
    description: "Backpacker beach paradise with nightlife, cafes, scooters, and cheap hostels.",
    tags: ["party", "beach", "cheap", "cafes"]
  },

  {
    id: "koh-rong",
    name: "Koh Rong, Cambodia",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80",
    budget: "$12 - $20",
    season: "November to May",
    description: "Island backpacking with glowing plankton tours and beach hostels.",
    tags: ["island", "hostels", "nightlife", "tropical"]
  },

  {
    id: "bali",
    name: "Bali, Indonesia",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900&q=80",
    budget: "$20 - $35",
    season: "April to October",
    description: "Surf towns, rice terraces, beach clubs, and digital nomad backpack culture.",
    tags: ["surfing", "island", "backpacking", "nature"]
  }

],

  cities: [

    {
      id: "hanoi-vietnam",
      name: "Hanoi, Vietnam",
      image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=900&q=80",
      budget: "$15 - $22",
      season: "September to November",
      description: "Street food heaven packed with cheap backpacker hostels and chaotic nightlife.",
      tags: ["street food", "nightlife", "culture", "budget"]
    },

    {
      id: "tokyo-japan",
      name: "Tokyo, Japan",
      image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900&q=80",
      budget: "$35 - $60",
      season: "March to April",
      description: "Cyberpunk city vibes, capsule hostels, ramen alleys, and endless exploration.",
      tags: ["anime", "technology", "food", "city"]
    }

  ],

  nature: [

  {
    id: "amazon",
    name: "Amazon Rainforest, Brazil",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80",
    budget: "$20 - $40",
    season: "June to November",
    description: "Dense jungle adventures, wildlife exploration, river expeditions, and eco backpacking.",
    tags: ["forest", "wildlife", "nature", "adventure"]
  },

  {
    id: "yellowstone",
    name: "Yellowstone, USA",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80",
    budget: "$30 - $55",
    season: "May to September",
    description: "Massive national park with geysers, waterfalls, wildlife, and camping routes.",
    tags: ["camping", "wildlife", "national park", "hiking"]
  },

  {
    id: "fiordland",
    name: "Fiordland, New Zealand",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=900&q=80",
    budget: "$35 - $60",
    season: "December to March",
    description: "Epic fjords, waterfalls, scenic trails, and untouched wilderness landscapes.",
    tags: ["fjords", "trekking", "nature", "lakes"]
  }

],

  culture: [

  {
    id: "kyoto",
    name: "Kyoto, Japan",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=900&q=80",
    budget: "$30 - $50",
    season: "March to May",
    description: "Historic temples, tea houses, shrines, and traditional Japanese culture.",
    tags: ["history", "temples", "culture", "japan"]
  },

  {
    id: "rome",
    name: "Rome, Italy",
    image: "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=900&q=80",
    budget: "$35 - $65",
    season: "April to June",
    description: "Ancient ruins, historic streets, Roman architecture, and vibrant piazzas.",
    tags: ["history", "architecture", "culture", "food"]
  },

  {
    id: "marrakech",
    name: "Marrakech, Morocco",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=900&q=80",
    budget: "$18 - $35",
    season: "October to April",
    description: "Colorful souks, desert culture, riads, spices, and traditional markets.",
    tags: ["markets", "desert", "culture", "architecture"]
  }

],

  food: [

  {
    id: "bangkok",
    name: "Bangkok, Thailand",
    image: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=900&q=80",
    budget: "$12 - $25",
    season: "November to February",
    description: "Legendary street food capital packed with night markets and cheap eats.",
    tags: ["street food", "markets", "budget", "nightlife"]
  },

  {
    id: "istanbul",
    name: "Istanbul, Turkey",
    image: "https://images.unsplash.com/photo-1527838832700-5059252407fa?w=900&q=80",
    budget: "$18 - $35",
    season: "April to June",
    description: "Kebabs, Turkish tea, baklava, bustling bazaars, and rich culinary culture.",
    tags: ["kebabs", "markets", "tea", "culture"]
  },

  {
    id: "mexico-city",
    name: "Mexico City, Mexico",
    image: "https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=900&q=80",
    budget: "$15 - $30",
    season: "March to May",
    description: "Tacos, local markets, authentic street food, and vibrant food districts.",
    tags: ["street food", "tacos", "markets", "budget"]
  }

]

};