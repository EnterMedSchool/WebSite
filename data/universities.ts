export type City = { city: string; lat: number; lng: number; uni: string };
export type CountryCities = Record<string, City[]>; // keyed by ISO A3 or name

// Demo dataset: a handful of cities per country
export const demoUniversities: CountryCities = {
  Italy: [
    { city: "Turin", lat: 45.0703, lng: 7.6869, uni: "University of Turin" },
    { city: "Pavia", lat: 45.185, lng: 9.160, uni: "University of Pavia" },
    { city: "Parma", lat: 44.8015, lng: 10.3279, uni: "University of Parma" },
    { city: "Padova", lat: 45.4064, lng: 11.8768, uni: "University of Padua" },
    { city: "Milano", lat: 45.4642, lng: 9.19, uni: "Università degli Studi di Milano" },
    { city: "Bologna", lat: 44.4949, lng: 11.3426, uni: "University of Bologna" },
    { city: "Rome", lat: 41.9028, lng: 12.4964, uni: "Sapienza University of Rome" },
    { city: "Naples", lat: 40.8518, lng: 14.2681, uni: "Federico II" },
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

