-- Oink database schema for Supabase Postgres
-- Run this in the SQL Editor in your Supabase dashboard

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    pig_avatar_config JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    kind VARCHAR(20) NOT NULL,
    category JSONB NOT NULL DEFAULT '[]'::JSONB,
    budget VARCHAR(4) NOT NULL,
    address TEXT,
    city VARCHAR(120),
    area VARCHAR(120),
    postcode VARCHAR(24),
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    google_maps_url TEXT,
    cover_image_url TEXT,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_restaurant_kind CHECK (kind IN ('restaurant', 'bar', 'cafe')),
    CONSTRAINT ck_restaurant_budget CHECK (budget IN ('$', '$$', '$$$', '$$$$'))
);

CREATE INDEX IF NOT EXISTS idx_restaurants_created_by ON restaurants(created_by);

-- Restaurant images table
CREATE TABLE IF NOT EXISTS restaurant_images (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    uploaded_by VARCHAR(36) NOT NULL REFERENCES users(id),
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_images_restaurant_id ON restaurant_images(restaurant_id);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    review_text TEXT NOT NULL,
    recommended_dishes JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_restaurant_id ON recommendations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);

-- Reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id VARCHAR(36) PRIMARY KEY,
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id),
    type VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, user_id),
    CONSTRAINT ck_reaction_type CHECK (type IN ('oink', 'shame'))
);

CREATE INDEX IF NOT EXISTS idx_reactions_restaurant_id ON reactions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    user_id VARCHAR(36) REFERENCES users(id),
    restaurant_id VARCHAR(36) NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, restaurant_id)
);
