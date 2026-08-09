import type { Budget, PigConfig } from "./pig";

export type Kind = "restaurant" | "bar" | "cafe";
export type ReactionType = "oink" | "shame";

export type User = {
  id: string;
  username: string;
  display_name: string;
  pig_avatar_config: PigConfig;
  places_logged: number;
};

export type Image = {
  id: string;
  url: string;
  uploaded_by: string;
  created_at: string;
};

export type PlaceSummary = {
  id: string;
  name: string;
  kind: Kind;
  category: string[];
  budget: Budget;
  city: string | null;
  area: string | null;
  postcode: string | null;
  lat: number;
  lng: number;
  cover_image_url: string | null;
  google_maps_url: string | null;
  recommenders: User[];
  recommender_count: number;
  shamers: User[];
  shame_count: number;
  shamed_only: boolean;
};

export type Recommendation = {
  id: string;
  user: User;
  review_text: string;
  recommended_dishes: string[];
  images: Image[];
  created_at: string;
  updated_at: string;
};

export type PlaceDetail = PlaceSummary & {
  address: string | null;
  images: Image[];
  recommendations: Recommendation[];
  oink_count: number;
  oinked_by: User[];
  shamed_by: User[];
  my_reaction: ReactionType | null;
  my_recommendation: Recommendation | null;
  in_my_wishlist: boolean;
};

export type FeedItem = {
  id: string;
  activity: "recommendation" | "oink" | "shame";
  user: User;
  restaurant: PlaceSummary;
  review_text: string | null;
  recommended_dishes: string[];
  images: Image[];
  created_at: string;
};

export type ParsedLink = {
  name: string | null;
  address: string | null;
  city: string | null;
  area: string | null;
  postcode: string | null;
  lat: number | null;
  lng: number | null;
  resolved: boolean;
  source: "google_places" | "url_parse" | "none";
};

export type PlaceCandidate = {
  name: string;
  address: string | null;
  city: string | null;
  area: string | null;
  postcode: string | null;
  lat: number;
  lng: number;
};
