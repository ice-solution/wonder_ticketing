import type { Types } from "mongoose";
import { Event, TicketType } from "../models/index.js";
import type { EventCategorySlug, EventCitySlug, EventRegionSlug } from "../../shared/eventBrowse.js";
import { CITY_REGION } from "../../shared/eventBrowse.js";

export type DemoEventSeed = {
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  venue: string;
  category: EventCategorySlug;
  city: EventCitySlug;
  daysFromNow: number;
  isFeatured?: boolean;
  ticketName: string;
  price: number;
  quantity: number;
};

export const DEMO_EVENT_SEEDS: DemoEventSeed[] = [
  {
    slug: "demo-hk-ai-summit",
    title: "香港 AI 創新峰會 2026",
    titleEn: "Hong Kong AI Innovation Summit 2026",
    description: "探索生成式 AI 在活動與零售的應用。",
    venue: "香港會議展覽中心",
    category: "ai",
    city: "hong_kong",
    daysFromNow: 5,
    isFeatured: true,
    ticketName: "標準入場",
    price: 380,
    quantity: 200,
  },
  {
    slug: "demo-hk-tech-night",
    title: "Wonder Tech Night",
    titleEn: "Wonder Tech Night",
    description: "本地科技社群交流夜。",
    venue: "Cyberport",
    category: "technology",
    city: "hong_kong",
    daysFromNow: 8,
    ticketName: "一般入場",
    price: 120,
    quantity: 150,
  },
  {
    slug: "demo-hk-food-festival",
    title: "港味美食節",
    titleEn: "Hong Kong Food Festival",
    description: "精選本地與亞洲街頭美食。",
    venue: "中環海濱",
    category: "food_drink",
    city: "hong_kong",
    daysFromNow: 12,
    isFeatured: true,
    ticketName: "一日通行",
    price: 88,
    quantity: 500,
  },
  {
    slug: "demo-hk-jazz-live",
    title: "維港爵士夜",
    titleEn: "Harbour Jazz Live",
    description: "戶外爵士樂現場。",
    venue: "西九文化區",
    category: "music",
    city: "hong_kong",
    daysFromNow: 14,
    ticketName: "站立區",
    price: 260,
    quantity: 300,
  },
  {
    slug: "demo-hk-wellness-retreat",
    title: "城市身心療癒日",
    titleEn: "Urban Wellness Retreat",
    description: "瑜伽、冥想與健康講座。",
    venue: "南丫島",
    category: "wellness",
    city: "hong_kong",
    daysFromNow: 18,
    ticketName: "全日套票",
    price: 450,
    quantity: 80,
  },
  {
    slug: "demo-hk-startup-pitch",
    title: "新創路演日",
    titleEn: "Startup Pitch Day",
    description: "10 組新創團隊現場簡報。",
    venue: "WeWork 銅鑼灣",
    category: "business",
    city: "hong_kong",
    daysFromNow: 21,
    ticketName: "觀眾票",
    price: 0,
    quantity: 120,
  },
  {
    slug: "demo-hk-crypto-forum",
    title: "Web3 香港論壇",
    titleEn: "Web3 Hong Kong Forum",
    description: "區塊鏈與數碼資產趨勢。",
    venue: "IFC 二期",
    category: "crypto",
    city: "hong_kong",
    daysFromNow: 25,
    ticketName: "論壇入場",
    price: 520,
    quantity: 180,
  },
  {
    slug: "demo-hk-art-biennale",
    title: "當代藝術雙年展",
    titleEn: "Contemporary Art Biennale",
    description: "亞洲當代藝術聯展。",
    venue: "M+ 博物館",
    category: "arts_culture",
    city: "hong_kong",
    daysFromNow: 28,
    isFeatured: true,
    ticketName: "展覽門票",
    price: 150,
    quantity: 400,
  },
  {
    slug: "demo-hk-climate-talk",
    title: "氣候行動論壇",
    titleEn: "Climate Action Forum",
    description: "企業 ESG 與可持續發展。",
    venue: "香港大學",
    category: "climate",
    city: "hong_kong",
    daysFromNow: 32,
    ticketName: "參與者",
    price: 200,
    quantity: 100,
  },
  {
    slug: "demo-hk-marathon-prep",
    title: "城市跑訓練營",
    titleEn: "City Marathon Prep Camp",
    description: "賽前訓練與補給體驗。",
    venue: "啟德體育園",
    category: "fitness",
    city: "hong_kong",
    daysFromNow: 35,
    ticketName: "訓練營",
    price: 180,
    quantity: 60,
  },
  {
    slug: "demo-tpe-design-week",
    title: "台北設計週",
    titleEn: "Taipei Design Week",
    description: "平面與產品設計展。",
    venue: "松山文創園區",
    category: "arts_culture",
    city: "taipei",
    daysFromNow: 10,
    ticketName: "入場券",
    price: 320,
    quantity: 250,
  },
  {
    slug: "demo-tpe-night-market",
    title: "台北夜市美食巡禮",
    titleEn: "Taipei Night Market Tour",
    description: "導覽式夜市體驗。",
    venue: "寧夏夜市",
    category: "food_drink",
    city: "taipei",
    daysFromNow: 16,
    ticketName: "導覽票",
    price: 199,
    quantity: 40,
  },
  {
    slug: "demo-tokyo-ai-lab",
    title: "東京 AI 實驗室開放日",
    titleEn: "Tokyo AI Lab Open Day",
    description: "人機互動與機器人展示。",
    venue: "渋谷",
    category: "ai",
    city: "tokyo",
    daysFromNow: 20,
    ticketName: "參觀票",
    price: 2500,
    quantity: 90,
  },
  {
    slug: "demo-sg-fintech",
    title: "新加坡金融科技大會",
    titleEn: "Singapore FinTech Conference",
    description: "支付與監管科技。",
    venue: "Marina Bay Sands",
    category: "business",
    city: "singapore",
    daysFromNow: 24,
    isFeatured: true,
    ticketName: "大會通行證",
    price: 680,
    quantity: 350,
  },
  {
    slug: "demo-seoul-kpop-workshop",
    title: "K-Pop 舞蹈工作坊",
    titleEn: "K-Pop Dance Workshop",
    description: "初學者友善舞蹈班。",
    venue: "弘大",
    category: "music",
    city: "seoul",
    daysFromNow: 30,
    ticketName: "工作坊",
    price: 45000,
    quantity: 30,
  },
  {
    slug: "demo-bkk-street-food",
    title: "曼谷街頭美食之旅",
    titleEn: "Bangkok Street Food Tour",
    description: "泰式料理深度體驗。",
    venue: "洽圖洽",
    category: "food_drink",
    city: "bangkok",
    daysFromNow: 38,
    ticketName: "美食團",
    price: 890,
    quantity: 25,
  },
  {
    slug: "demo-syd-climate-hike",
    title: "悉尼海岸淨灘行",
    titleEn: "Sydney Coastal Clean-up Hike",
    description: "環保徒步與海洋保育。",
    venue: "Bondi Beach",
    category: "climate",
    city: "sydney",
    daysFromNow: 42,
    ticketName: "參加費",
    price: 35,
    quantity: 50,
  },
  {
    slug: "demo-kl-education-fair",
    title: "吉隆坡教育展",
    titleEn: "Kuala Lumpur Education Fair",
    description: "升學與職涯規劃。",
    venue: "KLCC",
    category: "education",
    city: "kuala_lumpur",
    daysFromNow: 45,
    ticketName: "入場",
    price: 0,
    quantity: 800,
  },
  {
    slug: "demo-london-tech-meetup",
    title: "London SaaS Meetup",
    titleEn: "London SaaS Meetup",
    description: "B2B SaaS 產品交流。",
    venue: "Shoreditch",
    category: "technology",
    city: "london",
    daysFromNow: 50,
    ticketName: "Meetup",
    price: 15,
    quantity: 80,
  },
  {
    slug: "demo-ny-wellness-summit",
    title: "紐約健康科技峰會",
    titleEn: "NYC HealthTech Summit",
    description: "數碼健康與遠距醫療。",
    venue: "Manhattan",
    category: "wellness",
    city: "new_york",
    daysFromNow: 55,
    isFeatured: true,
    ticketName: "峰會票",
    price: 299,
    quantity: 220,
  },
];

export async function seedDemoEvents(organizerId: Types.ObjectId) {
  let created = 0;
  let skipped = 0;

  for (const demo of DEMO_EVENT_SEEDS) {
    const exists = await Event.findOne({ slug: demo.slug }).lean();
    if (exists) {
      skipped += 1;
      continue;
    }

    const region = CITY_REGION[demo.city] as EventRegionSlug;
    const eventDate = new Date(Date.now() + demo.daysFromNow * 86400000);
    eventDate.setHours(19, 0, 0, 0);

    const event = await Event.create({
      title: demo.title,
      titleEn: demo.titleEn,
      description: demo.description,
      eventDate,
      venue: demo.venue,
      slug: demo.slug,
      status: "published",
      visibility: "public",
      category: demo.category,
      region,
      city: demo.city,
      isFeatured: demo.isFeatured ?? false,
      createdBy: organizerId,
      maxAttendees: 300,
      enableEmbedWidget: true,
    });

    await TicketType.create({
      eventId: event._id,
      name: demo.ticketName,
      price: demo.price,
      quantity: demo.quantity,
      sold: 0,
      status: "active",
      sortOrder: 0,
    });

    created += 1;
  }

  return { created, skipped, total: DEMO_EVENT_SEEDS.length };
}
