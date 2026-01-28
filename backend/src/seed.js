require('dotenv').config({ path: '../.env' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('Starting database seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.aIGeneration.deleteMany();
  await prisma.aRSession.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.furniture.deleteMany();
  await prisma.colorPalette.deleteMany();
  await prisma.room.deleteMany();
  await prisma.design.deleteMany();
  await prisma.user.deleteMany();
  await prisma.stylePreset.deleteMany();
  await prisma.material.deleteMany();
  await prisma.inspiration.deleteMany();

  // Create demo user
  console.log('Creating demo user...');
  const hashedPassword = await bcrypt.hash(process.env.DEMO_PASSWORD || 'demo123456', 10);
  const demoUser = await prisma.user.create({
    data: {
      email: process.env.DEMO_EMAIL || 'demo@aiinterior.com',
      password: hashedPassword,
      name: 'Demo User',
      role: 'user',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo'
    }
  });

  // Create additional users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john@example.com',
        password: hashedPassword,
        name: 'John Designer',
        role: 'user',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john'
      }
    }),
    prisma.user.create({
      data: {
        email: 'sarah@example.com',
        password: hashedPassword,
        name: 'Sarah Architect',
        role: 'user',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah'
      }
    })
  ]);

  // Create subscriptions for users
  console.log('Creating subscriptions...');
  await prisma.subscription.create({
    data: {
      userId: demoUser.id,
      plan: 'pro',
      status: 'active',
      designsLeft: 45,
      price: 19.99
    }
  });

  // Create 15+ Style Presets
  console.log('Creating style presets...');
  const stylePresets = await Promise.all([
    { name: 'Modern Minimalist', description: 'Clean lines, neutral colors, and functional furniture', thumbnail: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400', colors: '#FFFFFF,#F5F5F5,#333333,#000000,#E0E0E0', furniture: 'Low-profile sofa, glass coffee table, minimalist shelving', materials: 'Glass, Steel, Concrete, Wood', characteristics: 'Open spaces, natural light, minimal decor', popularity: 150 },
    { name: 'Scandinavian', description: 'Light, airy spaces with natural materials and cozy textiles', thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400', colors: '#FFFFFF,#F8F4E3,#A8DADC,#457B9D,#1D3557', furniture: 'Wooden dining set, linen sofa, pendant lights', materials: 'Light wood, Wool, Linen, Ceramic', characteristics: 'Hygge atmosphere, functional beauty, natural elements', popularity: 180 },
    { name: 'Industrial', description: 'Raw materials, exposed elements, and urban character', thumbnail: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400', colors: '#2C3E50,#7F8C8D,#E74C3C,#ECF0F1,#34495E', furniture: 'Metal shelving, leather sofa, factory-style lighting', materials: 'Exposed brick, Metal, Reclaimed wood, Concrete', characteristics: 'High ceilings, open ductwork, vintage fixtures', popularity: 120 },
    { name: 'Mid-Century Modern', description: 'Retro elegance with organic shapes and bold colors', thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', colors: '#F39C12,#16A085,#8E44AD,#2C3E50,#ECF0F1', furniture: 'Eames chair, teak sideboard, sunburst mirror', materials: 'Teak, Walnut, Brass, Vinyl', characteristics: 'Organic curves, bold patterns, statement pieces', popularity: 140 },
    { name: 'Bohemian', description: 'Eclectic mix of colors, patterns, and global influences', thumbnail: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400', colors: '#E91E63,#FF9800,#4CAF50,#9C27B0,#00BCD4', furniture: 'Floor cushions, rattan furniture, vintage finds', materials: 'Macrame, Rattan, Kilim rugs, Natural fibers', characteristics: 'Layered textiles, plants, collected treasures', popularity: 130 },
    { name: 'Contemporary', description: 'Current trends with sophisticated, refined aesthetics', thumbnail: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400', colors: '#607D8B,#455A64,#FFFFFF,#FFC107,#263238', furniture: 'Modular sofa, sculptural lighting, art pieces', materials: 'Mixed metals, Velvet, Marble, Glass', characteristics: 'Bold art, mixed textures, statement furniture', popularity: 160 },
    { name: 'Traditional', description: 'Timeless elegance with classic furnishings and rich colors', thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400', colors: '#8B4513,#DAA520,#006400,#800000,#F5F5DC', furniture: 'Wingback chair, mahogany desk, crystal chandelier', materials: 'Dark wood, Silk, Velvet, Brass', characteristics: 'Symmetry, ornate details, refined elegance', popularity: 100 },
    { name: 'Coastal', description: 'Beach-inspired relaxed living with ocean tones', thumbnail: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=400', colors: '#87CEEB,#F0E68C,#FFFFFF,#20B2AA,#DEB887', furniture: 'Wicker chairs, slipcovered sofa, driftwood accents', materials: 'Wicker, Linen, Whitewashed wood, Jute', characteristics: 'Light colors, natural textures, casual vibe', popularity: 110 },
    { name: 'Farmhouse', description: 'Rustic charm with modern comfort', thumbnail: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400', colors: '#FFFFFF,#D2B48C,#556B2F,#8B4513,#F5F5DC', furniture: 'Farmhouse table, apron sink, barn doors', materials: 'Shiplap, Galvanized metal, Distressed wood, Burlap', characteristics: 'Vintage finds, natural elements, cozy warmth', popularity: 125 },
    { name: 'Art Deco', description: 'Glamorous 1920s style with geometric patterns', thumbnail: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400', colors: '#FFD700,#000000,#FF1493,#00CED1,#FFFFFF', furniture: 'Velvet sofa, mirrored furniture, geometric rugs', materials: 'Lacquer, Chrome, Mirror, Velvet', characteristics: 'Bold geometry, luxe materials, dramatic contrasts', popularity: 90 },
    { name: 'Japanese Zen', description: 'Peaceful minimalism inspired by Japanese design', thumbnail: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400', colors: '#F5F5DC,#2F4F4F,#8B4513,#FFFFFF,#556B2F', furniture: 'Low platform bed, shoji screens, floor seating', materials: 'Bamboo, Rice paper, Natural stone, Tatami', characteristics: 'Simplicity, nature, balance, tranquility', popularity: 95 },
    { name: 'Eclectic', description: 'Curated mix of styles, eras, and influences', thumbnail: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=400', colors: '#FF6B6B,#4ECDC4,#45B7D1,#96CEB4,#FFEAA7', furniture: 'Mixed vintage and modern pieces', materials: 'Varied textures, Mixed metals, Global textiles', characteristics: 'Personal expression, collected over time', popularity: 115 },
    { name: 'Rustic Modern', description: 'Natural materials meet contemporary design', thumbnail: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400', colors: '#8B7355,#2F4F4F,#FFFFFF,#CD853F,#708090', furniture: 'Live-edge table, modern chairs, wool textiles', materials: 'Reclaimed wood, Stone, Raw metal, Leather', characteristics: 'Organic meets refined, warm neutrals', popularity: 105 },
    { name: 'Transitional', description: 'Bridge between traditional and contemporary', thumbnail: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=400', colors: '#D3D3D3,#708090,#F5F5DC,#A9A9A9,#FFFFFF', furniture: 'Clean-lined sofa, classic silhouettes', materials: 'Neutral fabrics, Mixed woods, Brushed metals', characteristics: 'Balanced, comfortable, timeless appeal', popularity: 135 },
    { name: 'Mediterranean', description: 'Sun-drenched warmth with Old World charm', thumbnail: 'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=400', colors: '#FFD700,#0000CD,#FF6347,#F5F5DC,#8B4513', furniture: 'Wrought iron furniture, terracotta pots, arched mirrors', materials: 'Terra cotta, Wrought iron, Ceramic tiles, Stucco', characteristics: 'Warm colors, textured walls, outdoor living', popularity: 85 },
    { name: 'Hollywood Regency', description: 'Glamorous, bold, and unapologetically luxurious', thumbnail: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=400', colors: '#FF69B4,#FFD700,#000000,#FFFFFF,#9400D3', furniture: 'Tufted sofas, mirrored consoles, lacquered pieces', materials: 'Lacquer, Mirror, Velvet, Gold leaf', characteristics: 'Drama, glamour, high contrast', popularity: 75 }
  ].map(style => prisma.stylePreset.create({ data: style })));

  // Create 15+ Materials
  console.log('Creating materials...');
  const materials = await Promise.all([
    { name: 'White Oak', category: 'Wood', texture: 'grain', color: '#DEB887', price: 45.00, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'Light-colored hardwood with prominent grain pattern' },
    { name: 'Carrara Marble', category: 'Stone', texture: 'veined', color: '#F5F5F5', price: 120.00, imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400', description: 'Italian white marble with subtle gray veining' },
    { name: 'Brushed Brass', category: 'Metal', texture: 'brushed', color: '#D4AF37', price: 85.00, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'Warm gold-toned metal with subtle brushed finish' },
    { name: 'Belgian Linen', category: 'Fabric', texture: 'woven', color: '#F5F5DC', price: 55.00, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'Natural flax fiber with relaxed texture' },
    { name: 'Terrazzo', category: 'Stone', texture: 'speckled', color: '#E8E8E8', price: 95.00, imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400', description: 'Composite material with marble chips in cement' },
    { name: 'Walnut', category: 'Wood', texture: 'grain', color: '#5D432C', price: 65.00, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'Rich dark hardwood with straight grain' },
    { name: 'Concrete', category: 'Stone', texture: 'smooth', color: '#808080', price: 35.00, imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400', description: 'Industrial material with modern appeal' },
    { name: 'Velvet', category: 'Fabric', texture: 'plush', color: '#4B0082', price: 75.00, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'Luxurious soft fabric with rich depth' },
    { name: 'Rattan', category: 'Natural', texture: 'woven', color: '#D2691E', price: 40.00, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'Natural palm fiber for coastal and bohemian styles' },
    { name: 'Ceramic Tile', category: 'Tile', texture: 'glazed', color: '#FFFFFF', price: 25.00, imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400', description: 'Versatile glazed clay tiles in various patterns' },
    { name: 'Leather', category: 'Fabric', texture: 'smooth', color: '#8B4513', price: 110.00, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'Full-grain leather for timeless elegance' },
    { name: 'Bamboo', category: 'Natural', texture: 'grain', color: '#E3C565', price: 30.00, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'Sustainable grass with wood-like appearance' },
    { name: 'Quartz', category: 'Stone', texture: 'smooth', color: '#FAFAFA', price: 100.00, imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400', description: 'Engineered stone for countertops' },
    { name: 'Mohair', category: 'Fabric', texture: 'fuzzy', color: '#C4A484', price: 130.00, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'Luxurious goat fiber with lustrous sheen' },
    { name: 'Blackened Steel', category: 'Metal', texture: 'matte', color: '#2F2F2F', price: 90.00, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'Heat-treated steel with dark patina' },
    { name: 'Cork', category: 'Natural', texture: 'cellular', color: '#C4A35A', price: 28.00, imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', description: 'Sustainable bark material for flooring and walls' }
  ].map(material => prisma.material.create({ data: material })));

  // Create 15+ Inspirations
  console.log('Creating inspirations...');
  const inspirations = await Promise.all([
    { title: 'Serene Minimalist Living Room', description: 'A peaceful retreat with clean lines and natural light', imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800', style: 'Modern Minimalist', roomType: 'Living Room', tags: 'minimalist,neutral,peaceful,modern', likes: 245 },
    { title: 'Cozy Scandinavian Bedroom', description: 'Warm textiles and light wood create hygge atmosphere', imageUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800', style: 'Scandinavian', roomType: 'Bedroom', tags: 'cozy,hygge,nordic,warm', likes: 312 },
    { title: 'Industrial Loft Kitchen', description: 'Exposed brick and metal accents define this urban space', imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', style: 'Industrial', roomType: 'Kitchen', tags: 'loft,urban,exposed,modern', likes: 189 },
    { title: 'Bohemian Reading Nook', description: 'Layered textiles and plants create a dreamy escape', imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800', style: 'Bohemian', roomType: 'Living Room', tags: 'boho,eclectic,colorful,cozy', likes: 278 },
    { title: 'Mid-Century Home Office', description: 'Retro furniture meets productive workspace', imageUrl: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800', style: 'Mid-Century Modern', roomType: 'Home Office', tags: 'retro,productive,stylish,functional', likes: 156 },
    { title: 'Coastal Bathroom Retreat', description: 'Ocean-inspired colors and natural textures', imageUrl: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800', style: 'Coastal', roomType: 'Bathroom', tags: 'beach,relaxing,natural,light', likes: 201 },
    { title: 'Farmhouse Dining Room', description: 'Rustic charm with family gathering appeal', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800', style: 'Farmhouse', roomType: 'Dining Room', tags: 'rustic,family,warm,inviting', likes: 234 },
    { title: 'Contemporary Master Suite', description: 'Sophisticated neutrals with luxe textures', imageUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800', style: 'Contemporary', roomType: 'Bedroom', tags: 'luxury,sophisticated,neutral,elegant', likes: 267 },
    { title: 'Zen Japanese Garden Room', description: 'Tranquil space inspired by Japanese aesthetics', imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800', style: 'Japanese Zen', roomType: 'Living Room', tags: 'zen,peaceful,minimalist,nature', likes: 198 },
    { title: 'Art Deco Entryway', description: 'Glamorous first impression with geometric patterns', imageUrl: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800', style: 'Art Deco', roomType: 'Entryway', tags: 'glamorous,bold,geometric,luxe', likes: 145 },
    { title: 'Traditional Library Study', description: 'Classic elegance with rich woods and leather', imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800', style: 'Traditional', roomType: 'Home Office', tags: 'classic,elegant,sophisticated,timeless', likes: 176 },
    { title: 'Eclectic Kids Playroom', description: 'Creative mix of colors and patterns for play', imageUrl: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800', style: 'Eclectic', roomType: 'Kids Room', tags: 'playful,colorful,creative,fun', likes: 223 },
    { title: 'Rustic Modern Living Space', description: 'Natural elements meet clean contemporary lines', imageUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', style: 'Rustic Modern', roomType: 'Living Room', tags: 'organic,modern,natural,warm', likes: 289 },
    { title: 'Mediterranean Courtyard', description: 'Sun-drenched outdoor living space', imageUrl: 'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=800', style: 'Mediterranean', roomType: 'Outdoor', tags: 'sunny,warm,outdoor,relaxed', likes: 167 },
    { title: 'Transitional Master Bathroom', description: 'Timeless elegance with modern amenities', imageUrl: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800', style: 'Transitional', roomType: 'Bathroom', tags: 'elegant,balanced,classic,modern', likes: 212 },
    { title: 'Hollywood Regency Bedroom', description: 'Glamorous retreat with bold statement pieces', imageUrl: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800', style: 'Hollywood Regency', roomType: 'Bedroom', tags: 'glamorous,bold,luxurious,statement', likes: 134 }
  ].map(inspiration => prisma.inspiration.create({ data: inspiration })));

  // Create 15+ Designs for demo user
  console.log('Creating designs...');
  const designs = await Promise.all([
    { userId: demoUser.id, name: 'Modern Downtown Apartment', description: 'Sleek urban living space with city views', style: 'Modern Minimalist', roomType: 'Living Room', budget: 25000, status: 'published', thumbnail: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400' },
    { userId: demoUser.id, name: 'Cozy Family Home', description: 'Warm and inviting family gathering spaces', style: 'Farmhouse', roomType: 'Living Room', budget: 35000, status: 'published', thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400' },
    { userId: demoUser.id, name: 'Beach House Retreat', description: 'Coastal-inspired vacation home design', style: 'Coastal', roomType: 'Bedroom', budget: 40000, status: 'published', thumbnail: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=400' },
    { userId: demoUser.id, name: 'Artist Studio Loft', description: 'Industrial creative workspace', style: 'Industrial', roomType: 'Home Office', budget: 20000, status: 'draft', thumbnail: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400' },
    { userId: demoUser.id, name: 'Zen Meditation Room', description: 'Peaceful sanctuary for mindfulness', style: 'Japanese Zen', roomType: 'Living Room', budget: 15000, status: 'published', thumbnail: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400' },
    { userId: demoUser.id, name: 'Luxury Master Suite', description: 'Opulent bedroom with spa-like bathroom', style: 'Contemporary', roomType: 'Bedroom', budget: 50000, status: 'published', thumbnail: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400' },
    { userId: demoUser.id, name: 'Retro Game Room', description: 'Mid-century entertainment space', style: 'Mid-Century Modern', roomType: 'Living Room', budget: 18000, status: 'draft', thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
    { userId: demoUser.id, name: 'Bohemian Studio', description: 'Eclectic creative space', style: 'Bohemian', roomType: 'Home Office', budget: 12000, status: 'published', thumbnail: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400' },
    { userId: demoUser.id, name: 'Scandinavian Kitchen', description: 'Light and functional cooking space', style: 'Scandinavian', roomType: 'Kitchen', budget: 45000, status: 'published', thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
    { userId: demoUser.id, name: 'Traditional Study', description: 'Classic home library and office', style: 'Traditional', roomType: 'Home Office', budget: 30000, status: 'draft', thumbnail: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400' },
    { userId: demoUser.id, name: 'Glamour Dressing Room', description: 'Hollywood-style walk-in closet', style: 'Hollywood Regency', roomType: 'Bedroom', budget: 22000, status: 'published', thumbnail: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=400' },
    { userId: demoUser.id, name: 'Outdoor Entertaining', description: 'Mediterranean patio design', style: 'Mediterranean', roomType: 'Outdoor', budget: 28000, status: 'published', thumbnail: 'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=400' },
    { userId: demoUser.id, name: 'Kids Adventure Room', description: 'Playful and creative children\'s space', style: 'Eclectic', roomType: 'Kids Room', budget: 10000, status: 'draft', thumbnail: 'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=400' },
    { userId: demoUser.id, name: 'Rustic Cabin Interior', description: 'Mountain retreat living spaces', style: 'Rustic Modern', roomType: 'Living Room', budget: 35000, status: 'published', thumbnail: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=400' },
    { userId: demoUser.id, name: 'Art Deco Bar', description: 'Glamorous home bar design', style: 'Art Deco', roomType: 'Living Room', budget: 25000, status: 'published', thumbnail: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=400' },
    { userId: demoUser.id, name: 'Transitional Dining', description: 'Elegant family dining room', style: 'Transitional', roomType: 'Dining Room', budget: 20000, status: 'draft', thumbnail: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=400' }
  ].map(design => prisma.design.create({ data: design })));

  // Create 15+ Rooms
  console.log('Creating rooms...');
  const rooms = await Promise.all([
    { designId: designs[0].id, name: 'Main Living Area', type: 'Living Room', width: 6.0, height: 3.0, length: 8.0, thumbnail: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400' },
    { designId: designs[0].id, name: 'Open Kitchen', type: 'Kitchen', width: 4.0, height: 3.0, length: 5.0, thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
    { designId: designs[1].id, name: 'Family Room', type: 'Living Room', width: 7.0, height: 2.8, length: 9.0, thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400' },
    { designId: designs[1].id, name: 'Country Kitchen', type: 'Kitchen', width: 5.0, height: 2.8, length: 6.0, thumbnail: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=400' },
    { designId: designs[2].id, name: 'Master Bedroom', type: 'Bedroom', width: 5.0, height: 3.0, length: 6.0, thumbnail: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400' },
    { designId: designs[2].id, name: 'En-Suite Bathroom', type: 'Bathroom', width: 3.0, height: 2.8, length: 4.0, thumbnail: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400' },
    { designId: designs[3].id, name: 'Creative Studio', type: 'Home Office', width: 8.0, height: 4.0, length: 10.0, thumbnail: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400' },
    { designId: designs[4].id, name: 'Meditation Space', type: 'Living Room', width: 4.0, height: 2.5, length: 4.0, thumbnail: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400' },
    { designId: designs[5].id, name: 'Luxury Bedroom', type: 'Bedroom', width: 6.0, height: 3.2, length: 7.0, thumbnail: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400' },
    { designId: designs[5].id, name: 'Spa Bathroom', type: 'Bathroom', width: 4.0, height: 3.0, length: 5.0, thumbnail: 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=400' },
    { designId: designs[6].id, name: 'Entertainment Room', type: 'Living Room', width: 5.0, height: 2.8, length: 6.0, thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
    { designId: designs[7].id, name: 'Art Studio', type: 'Home Office', width: 5.0, height: 3.0, length: 6.0, thumbnail: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400' },
    { designId: designs[8].id, name: 'Modern Kitchen', type: 'Kitchen', width: 5.0, height: 2.8, length: 7.0, thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
    { designId: designs[9].id, name: 'Library Study', type: 'Home Office', width: 4.0, height: 3.0, length: 5.0, thumbnail: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400' },
    { designId: designs[10].id, name: 'Walk-in Closet', type: 'Bedroom', width: 3.0, height: 2.5, length: 4.0, thumbnail: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=400' },
    { designId: designs[11].id, name: 'Patio Area', type: 'Outdoor', width: 6.0, height: 0, length: 8.0, thumbnail: 'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=400' }
  ].map(room => prisma.room.create({ data: room })));

  // Create 15+ Furniture items
  console.log('Creating furniture...');
  const furnitureItems = await Promise.all([
    { designId: designs[0].id, roomId: rooms[0].id, name: 'Modular Sectional Sofa', category: 'Seating', style: 'Modern', color: 'Gray', material: 'Linen', price: 3500, dimensions: '120"W x 90"D x 32"H', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', aiGenerated: false },
    { designId: designs[0].id, roomId: rooms[0].id, name: 'Glass Coffee Table', category: 'Table', style: 'Modern', color: 'Clear', material: 'Glass/Steel', price: 899, dimensions: '48"W x 24"D x 16"H', imageUrl: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=400', aiGenerated: false },
    { designId: designs[0].id, roomId: rooms[0].id, name: 'Arc Floor Lamp', category: 'Lighting', style: 'Modern', color: 'Chrome', material: 'Metal', price: 450, dimensions: '72"H', imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', aiGenerated: true },
    { designId: designs[1].id, roomId: rooms[2].id, name: 'Farmhouse Dining Table', category: 'Table', style: 'Farmhouse', color: 'Natural', material: 'Reclaimed Wood', price: 2200, dimensions: '84"W x 42"D x 30"H', imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400', aiGenerated: false },
    { designId: designs[1].id, roomId: rooms[2].id, name: 'Windsor Dining Chairs', category: 'Seating', style: 'Farmhouse', color: 'White', material: 'Wood', price: 200, dimensions: '18"W x 20"D x 36"H', imageUrl: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400', aiGenerated: false },
    { designId: designs[2].id, roomId: rooms[4].id, name: 'Rattan Platform Bed', category: 'Bedroom', style: 'Coastal', color: 'Natural', material: 'Rattan', price: 1800, dimensions: 'King Size', imageUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400', aiGenerated: true },
    { designId: designs[2].id, roomId: rooms[4].id, name: 'Linen Nightstands', category: 'Storage', style: 'Coastal', color: 'White', material: 'Wood/Linen', price: 550, dimensions: '24"W x 18"D x 26"H', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', aiGenerated: false },
    { designId: designs[3].id, roomId: rooms[6].id, name: 'Industrial Desk', category: 'Table', style: 'Industrial', color: 'Black', material: 'Metal/Wood', price: 1200, dimensions: '60"W x 30"D x 30"H', imageUrl: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=400', aiGenerated: false },
    { designId: designs[3].id, roomId: rooms[6].id, name: 'Leather Task Chair', category: 'Seating', style: 'Industrial', color: 'Brown', material: 'Leather/Metal', price: 800, dimensions: '24"W x 26"D x 42"H', imageUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400', aiGenerated: true },
    { designId: designs[4].id, roomId: rooms[7].id, name: 'Floor Meditation Cushion', category: 'Seating', style: 'Japanese', color: 'Beige', material: 'Cotton', price: 150, dimensions: '24"W x 24"D x 6"H', imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400', aiGenerated: false },
    { designId: designs[5].id, roomId: rooms[8].id, name: 'Velvet Upholstered Bed', category: 'Bedroom', style: 'Contemporary', color: 'Navy', material: 'Velvet', price: 2800, dimensions: 'King Size', imageUrl: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400', aiGenerated: false },
    { designId: designs[5].id, roomId: rooms[8].id, name: 'Crystal Chandelier', category: 'Lighting', style: 'Contemporary', color: 'Gold', material: 'Crystal/Brass', price: 1500, dimensions: '24"Dia x 30"H', imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', aiGenerated: true },
    { designId: designs[6].id, roomId: rooms[10].id, name: 'Eames Lounge Chair', category: 'Seating', style: 'Mid-Century', color: 'Black', material: 'Leather/Walnut', price: 4500, dimensions: '33"W x 32"D x 33"H', imageUrl: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400', aiGenerated: false },
    { designId: designs[7].id, roomId: rooms[11].id, name: 'Macrame Wall Hanging', category: 'Decor', style: 'Bohemian', color: 'Cream', material: 'Cotton', price: 180, dimensions: '36"W x 48"H', imageUrl: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400', aiGenerated: true },
    { designId: designs[8].id, roomId: rooms[12].id, name: 'Nordic Pendant Light', category: 'Lighting', style: 'Scandinavian', color: 'White', material: 'Metal', price: 350, dimensions: '16"Dia', imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', aiGenerated: false },
    { designId: designs[9].id, roomId: rooms[13].id, name: 'Chesterfield Sofa', category: 'Seating', style: 'Traditional', color: 'Green', material: 'Velvet', price: 3200, dimensions: '84"W x 36"D x 32"H', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', aiGenerated: false }
  ].map(item => prisma.furniture.create({ data: item })));

  // Create 15+ Color Palettes
  console.log('Creating color palettes...');
  const palettes = await Promise.all([
    { designId: designs[0].id, name: 'Urban Neutral', colors: JSON.stringify(['#FFFFFF', '#F5F5F5', '#333333', '#666666', '#E0E0E0']), style: 'Modern', mood: 'Sophisticated', aiGenerated: false },
    { designId: designs[1].id, name: 'Farmhouse Warm', colors: JSON.stringify(['#F5F5DC', '#D2B48C', '#8B7355', '#556B2F', '#FFFFFF']), style: 'Farmhouse', mood: 'Cozy', aiGenerated: false },
    { designId: designs[2].id, name: 'Ocean Breeze', colors: JSON.stringify(['#87CEEB', '#F0E68C', '#FFFFFF', '#20B2AA', '#DEB887']), style: 'Coastal', mood: 'Relaxed', aiGenerated: true },
    { designId: designs[3].id, name: 'Industrial Raw', colors: JSON.stringify(['#2C3E50', '#7F8C8D', '#E74C3C', '#ECF0F1', '#34495E']), style: 'Industrial', mood: 'Edgy', aiGenerated: false },
    { designId: designs[4].id, name: 'Zen Serenity', colors: JSON.stringify(['#F5F5DC', '#2F4F4F', '#8B4513', '#FFFFFF', '#556B2F']), style: 'Japanese', mood: 'Peaceful', aiGenerated: true },
    { designId: designs[5].id, name: 'Luxury Suite', colors: JSON.stringify(['#1A1A2E', '#16213E', '#0F3460', '#E94560', '#FFD700']), style: 'Contemporary', mood: 'Glamorous', aiGenerated: false },
    { designId: designs[6].id, name: 'Retro Pop', colors: JSON.stringify(['#F39C12', '#16A085', '#8E44AD', '#2C3E50', '#ECF0F1']), style: 'Mid-Century', mood: 'Playful', aiGenerated: true },
    { designId: designs[7].id, name: 'Boho Dreams', colors: JSON.stringify(['#E91E63', '#FF9800', '#4CAF50', '#9C27B0', '#00BCD4']), style: 'Bohemian', mood: 'Eclectic', aiGenerated: false },
    { designId: designs[8].id, name: 'Nordic Light', colors: JSON.stringify(['#FFFFFF', '#F8F4E3', '#A8DADC', '#457B9D', '#1D3557']), style: 'Scandinavian', mood: 'Airy', aiGenerated: false },
    { designId: designs[9].id, name: 'Library Classic', colors: JSON.stringify(['#8B4513', '#DAA520', '#006400', '#800000', '#F5F5DC']), style: 'Traditional', mood: 'Refined', aiGenerated: true },
    { designId: designs[10].id, name: 'Regency Glam', colors: JSON.stringify(['#FF69B4', '#FFD700', '#000000', '#FFFFFF', '#9400D3']), style: 'Hollywood', mood: 'Dramatic', aiGenerated: false },
    { designId: designs[11].id, name: 'Mediterranean Sun', colors: JSON.stringify(['#FFD700', '#0000CD', '#FF6347', '#F5F5DC', '#8B4513']), style: 'Mediterranean', mood: 'Warm', aiGenerated: true },
    { designId: null, name: 'Forest Haven', colors: JSON.stringify(['#228B22', '#2F4F4F', '#8FBC8F', '#D2691E', '#F5F5DC']), style: 'Rustic', mood: 'Natural', aiGenerated: true },
    { designId: null, name: 'Sunset Glow', colors: JSON.stringify(['#FF6B6B', '#FEC89A', '#FFD93D', '#6BCB77', '#4D96FF']), style: 'Eclectic', mood: 'Energetic', aiGenerated: true },
    { designId: null, name: 'Midnight Jazz', colors: JSON.stringify(['#1A1A2E', '#4A4E69', '#9A8C98', '#C9ADA7', '#F2E9E4']), style: 'Art Deco', mood: 'Mysterious', aiGenerated: false },
    { designId: null, name: 'Spring Garden', colors: JSON.stringify(['#98D8C8', '#F7DC6F', '#BB8FCE', '#F1948A', '#85C1E9']), style: 'Contemporary', mood: 'Fresh', aiGenerated: true }
  ].map(palette => prisma.colorPalette.create({ data: palette })));

  // Create 15+ AR Sessions
  console.log('Creating AR sessions...');
  const arSessions = await Promise.all([
    { userId: demoUser.id, roomId: rooms[0].id, name: 'Living Room Layout Test', status: 'completed', thumbnail: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400' },
    { userId: demoUser.id, roomId: rooms[0].id, name: 'Sofa Placement Options', status: 'active', thumbnail: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400' },
    { userId: demoUser.id, roomId: rooms[2].id, name: 'Dining Table Sizing', status: 'completed', thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400' },
    { userId: demoUser.id, roomId: rooms[4].id, name: 'Bedroom Furniture Layout', status: 'active', thumbnail: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400' },
    { userId: demoUser.id, roomId: rooms[6].id, name: 'Office Desk Placement', status: 'completed', thumbnail: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=400' },
    { userId: demoUser.id, roomId: rooms[7].id, name: 'Meditation Corner Setup', status: 'active', thumbnail: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400' },
    { userId: demoUser.id, roomId: rooms[8].id, name: 'Master Bed Position', status: 'completed', thumbnail: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400' },
    { userId: demoUser.id, roomId: rooms[10].id, name: 'Entertainment Setup', status: 'active', thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
    { userId: demoUser.id, roomId: rooms[11].id, name: 'Art Display Options', status: 'completed', thumbnail: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400' },
    { userId: demoUser.id, roomId: rooms[12].id, name: 'Kitchen Island Test', status: 'active', thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
    { userId: demoUser.id, roomId: rooms[13].id, name: 'Bookshelf Arrangement', status: 'completed', thumbnail: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=400' },
    { userId: demoUser.id, roomId: rooms[14].id, name: 'Closet Organization', status: 'active', thumbnail: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=400' },
    { userId: demoUser.id, roomId: rooms[15].id, name: 'Patio Furniture Layout', status: 'completed', thumbnail: 'https://images.unsplash.com/photo-1600566753151-384129cf4e3e?w=400' },
    { userId: demoUser.id, roomId: null, name: 'Quick Room Scan 1', status: 'active', thumbnail: null },
    { userId: demoUser.id, roomId: null, name: 'Quick Room Scan 2', status: 'completed', thumbnail: null },
    { userId: demoUser.id, roomId: rooms[0].id, name: 'Lighting Test Session', status: 'active', thumbnail: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400' }
  ].map(session => prisma.aRSession.create({ data: session })));

  // Create 15+ AI Generations
  console.log('Creating AI generation history...');
  const aiGenerations = await Promise.all([
    { userId: demoUser.id, type: 'design', prompt: JSON.stringify({ roomType: 'Living Room', style: 'Modern' }), result: JSON.stringify({ designName: 'Urban Oasis', description: 'Modern living space' }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 850 },
    { userId: demoUser.id, type: 'palette', prompt: JSON.stringify({ mood: 'Calm', style: 'Scandinavian' }), result: JSON.stringify({ paletteName: 'Nordic Calm', colors: ['#FFFFFF', '#F5F5F5'] }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 420 },
    { userId: demoUser.id, type: 'furniture', prompt: JSON.stringify({ roomType: 'Bedroom', budget: 5000 }), result: JSON.stringify({ recommendations: [{ name: 'Platform Bed' }] }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 720 },
    { userId: demoUser.id, type: 'analysis', prompt: JSON.stringify({ description: 'Small apartment living room' }), result: JSON.stringify({ analysis: { currentState: 'Cramped' } }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 650 },
    { userId: demoUser.id, type: 'style-guide', prompt: JSON.stringify({ style: 'Industrial' }), result: JSON.stringify({ styleName: 'Industrial Chic' }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 920 },
    { userId: demoUser.id, type: 'design', prompt: JSON.stringify({ roomType: 'Kitchen', style: 'Farmhouse' }), result: JSON.stringify({ designName: 'Country Kitchen' }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 780 },
    { userId: demoUser.id, type: 'palette', prompt: JSON.stringify({ mood: 'Energetic', baseColor: '#FF6B6B' }), result: JSON.stringify({ paletteName: 'Sunset Vibes' }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 380 },
    { userId: demoUser.id, type: 'furniture', prompt: JSON.stringify({ roomType: 'Home Office', style: 'Modern' }), result: JSON.stringify({ recommendations: [{ name: 'Ergonomic Desk' }] }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 690 },
    { userId: demoUser.id, type: 'design', prompt: JSON.stringify({ roomType: 'Bathroom', style: 'Coastal' }), result: JSON.stringify({ designName: 'Beach Spa' }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 820 },
    { userId: demoUser.id, type: 'analysis', prompt: JSON.stringify({ description: 'Dark basement' }), result: JSON.stringify({ improvements: [{ area: 'Lighting' }] }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 580 },
    { userId: demoUser.id, type: 'palette', prompt: JSON.stringify({ mood: 'Luxurious', style: 'Art Deco' }), result: JSON.stringify({ paletteName: 'Golden Age' }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 410 },
    { userId: demoUser.id, type: 'style-guide', prompt: JSON.stringify({ style: 'Bohemian' }), result: JSON.stringify({ styleName: 'Boho Luxe' }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 890 },
    { userId: demoUser.id, type: 'furniture', prompt: JSON.stringify({ roomType: 'Dining Room', budget: 8000 }), result: JSON.stringify({ recommendations: [{ name: 'Dining Set' }] }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 750 },
    { userId: demoUser.id, type: 'design', prompt: JSON.stringify({ roomType: 'Bedroom', style: 'Japanese Zen' }), result: JSON.stringify({ designName: 'Zen Retreat' }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 840 },
    { userId: demoUser.id, type: 'analysis', prompt: JSON.stringify({ description: 'Open concept loft' }), result: JSON.stringify({ analysis: { currentState: 'Spacious but undefined' } }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 620 },
    { userId: demoUser.id, type: 'palette', prompt: JSON.stringify({ mood: 'Serene', style: 'Japanese' }), result: JSON.stringify({ paletteName: 'Zen Garden' }), status: 'completed', model: 'anthropic/claude-3-haiku', tokens: 390 }
  ].map(gen => prisma.aIGeneration.create({ data: gen })));

  console.log('Seed completed successfully!');
  console.log(`
Summary:
- Users: 3 (including demo user)
- Style Presets: ${stylePresets.length}
- Materials: ${materials.length}
- Inspirations: ${inspirations.length}
- Designs: ${designs.length}
- Rooms: ${rooms.length}
- Furniture: ${furnitureItems.length}
- Color Palettes: ${palettes.length}
- AR Sessions: ${arSessions.length}
- AI Generations: ${aiGenerations.length}

Demo credentials:
- Email: ${process.env.DEMO_EMAIL || 'demo@aiinterior.com'}
- Password: ${process.env.DEMO_PASSWORD || 'demo123456'}
  `);
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
