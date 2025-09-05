export type City = {
  city: string;
  lat: number;
  lng: number;
  uni: string;
  kind?: "public" | "private"; // demo flag
  logo?: string; // logo URL (optional)
  rating?: number; // 0-5
  lastScore?: number; // e.g., admission score 0-100 (demo)
  photos?: string[]; // demo gallery thumbnails
  orgs?: string[]; // demo student organizations
  article?: { title: string; href?: string };
};
export type CountryCities = Record<string, City[]>; // keyed by ISO A3 or name

// Demo dataset: a handful of cities per country
export const demoUniversities: CountryCities = {
  Italy: [
    { city: "Turin", lat: 45.0703, lng: 7.6869, uni: "University of Turin", kind: "public", rating: 4.3, lastScore: 62, orgs: ["EMS Turin", "Sports Club"], photos: [] },
    { city: "Pavia", lat: 45.185, lng: 9.160, uni: "University of Pavia", kind: "public", logo: "https://entermedschool.b-cdn.net/wp-content/uploads/2023/03/University-of-Pavia-Logo.png", rating: 4.6, lastScore: 68, photos: [
      "https://entermedschool.b-cdn.net/wp-content/uploads/2023/03/delfin-pQWJrMMmySA-unsplash-150x150.jpg",
      "https://entermedschool.b-cdn.net/wp-content/uploads/2023/04/photo_2023-04-10_11-18-15-150x150.jpg",
      "https://entermedschool.b-cdn.net/wp-content/uploads/2023/04/photo_2023-04-10_11-18-23-150x150.jpg",
    ], orgs: ["EMS Pavia", "Debate", "Volunteering"], article: { title: "Life as an EMS student in Pavia" } },
    { city: "Parma", lat: 44.8015, lng: 10.3279, uni: "University of Parma", kind: "private", logo: "https://entermedschool.b-cdn.net/wp-content/uploads/2023/03/logo-parma-mapa-300x272.png", rating: 4.1, lastScore: 60, photos: [], orgs: ["Choir", "Robotics"] },
    { city: "Padova", lat: 45.4064, lng: 11.8768, uni: "University of Padua", kind: "private", logo: "https://entermedschool.b-cdn.net/wp-content/uploads/2023/03/University-of-Padova-Logo-150x150.jpg", rating: 4.5, lastScore: 70, photos: [], orgs: ["EMS Padova"] },
    { city: "Milano", lat: 45.4642, lng: 9.19, uni: "Università degli Studi di Milano", kind: "public", rating: 4.4, lastScore: 66 },
    { city: "Bologna", lat: 44.4949, lng: 11.3426, uni: "University of Bologna", kind: "public", rating: 4.2, lastScore: 64 },
    { city: "Rome", lat: 41.9028, lng: 12.4964, uni: "Sapienza University of Rome", kind: "public", rating: 4.3, lastScore: 65 },
    { city: "Naples", lat: 40.8518, lng: 14.2681, uni: "Federico II", kind: "public", rating: 4.0, lastScore: 58 },
  ],
  "United Kingdom": [
    { city: "London", lat: 51.5072, lng: -0.1276, uni: "King's College London" },
    { city: "Manchester", lat: 53.4808, lng: -2.2426, uni: "University of Manchester" },
    { city: "Bristol", lat: 51.4545, lng: -2.5879, uni: "University of Bristol" },
    { city: "Glasgow", lat: 55.8642, lng: -4.2518, uni: "University of Glasgow" },
  ],
  Austria: [
    { city: "Vienna", lat: 48.2082, lng: 16.3738, uni: "MedUni Vienna" },
    { city: "Graz", lat: 47.0707, lng: 15.4395, uni: "MedUni Graz" },
    { city: "Innsbruck", lat: 47.2692, lng: 11.4041, uni: "Medical University Innsbruck" },
  ],
  Germany: [
    { city: "Hamburg", lat: 53.5511, lng: 9.9937, uni: "UKE Hamburg" },
    { city: "Berlin", lat: 52.52, lng: 13.405, uni: "Charité Berlin" },
    { city: "Heidelberg", lat: 49.3988, lng: 8.6724, uni: "Heidelberg University" },
    { city: "Munich", lat: 48.1374, lng: 11.5755, uni: "LMU Munich" },
  ],
};
