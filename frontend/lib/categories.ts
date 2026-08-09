/**
 * Category vocabulary — spec §6.3 / §15.
 *
 * Bars pick from a fixed set of drinking-institution types. Restaurants and
 * cafes use free-form cuisine tagging, with these as searchable suggestions.
 */
export const BAR_CATEGORIES = ["Pub", "Club", "Beer Garden", "Cocktail Bar", "Wine Bar", "Natural Wine"];

export const RESTAURANT_SUGGESTIONS = [
  "Turkish", "Italian", "Japanese", "Thai", "Chinese", "Indian", "Mexican",
  "Greek", "French", "Korean", "Vietnamese", "Lebanese", "Spanish", "Basque",
  "Portuguese", "Georgian", "Ethiopian", "Peruvian", "Caribbean",
  "Seafood", "Grill", "Barbecue", "Pizza", "Pasta", "Burgers", "Steak",
  "Dim Sum", "Ramen", "Sushi", "Curry", "Tapas", "Small Plates",
  "Vegetarian", "Vegan", "Brunch", "Breakfast", "Sunday Roast", "Fine Dining",
];

export const CAFE_SUGGESTIONS = [
  "Specialty Coffee", "Bakery", "Brunch", "Patisserie", "Tea House",
  "Baklava", "Sandwiches", "Deli", "Ice Cream", "Work-friendly",
];

export function categoriesFor(kind: string): { fixed: boolean; options: string[] } {
  if (kind === "bar") return { fixed: true, options: BAR_CATEGORIES };
  if (kind === "cafe") return { fixed: false, options: CAFE_SUGGESTIONS };
  return { fixed: false, options: RESTAURANT_SUGGESTIONS };
}
