const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const User = require('../models/User');

// ─── Seed Data (runs once if DB is empty) ───────────────
let hasSeeded = false; // Prevent re-seeding after user deletes all items

const seedListings = async () => {
  if (hasSeeded) return; // Only seed once per server session
  hasSeeded = true;

  try {
    let defaultUser = await User.findOne();
    if (!defaultUser) {
      defaultUser = await User.create({
        name: 'Rahul Kumar',
        email: 'rahul@easy.com',
        password: 'password123',
        phone: '+91 98765 43210'
      });
    }

    const seededListings = [
      {
        title: "Sony WH-1000XM4 Wireless Headphones",
        price: 5500,
        condition: "Like new",
        category: "Electronics",
        location: "Hazratganj",
        images: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=85",
          "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=85",
          "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=85"
        ],
        description: "Bought 6 months ago, barely used at home. Comes with original box, USB-C cable, 3.5mm cable, and carry case. Battery life is still excellent (28+ hrs per charge). Industry-leading noise cancellation works perfectly. Selling because I upgraded to the XM5.",
        brand: "Sony", model: "WH-1000XM4", age: "6 months", colour: "Black", warranty: "No", originalPrice: "₹29,990",
        seller: defaultUser._id, sellerName: "Rahul Kumar", sellerInitials: "RK", sellerPhone: "+91 98765 43210", distance: 2.1
      },
      {
        title: "iPhone 12 Pro (128GB)",
        price: 42000,
        condition: "Good",
        category: "Electronics",
        location: "Gomti Nagar",
        images: [
          "https://citizenside.com/wp-content/uploads/2024/03/iphone-12-pro-max-unlock-unlocking-iphone-12-pro-max-1709543027.jpg",
          "https://images.unsplash.com/photo-1574755393849-623942496936?w=800&q=85",
          "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=85"
        ],
        description: "Used iPhone 12 Pro in excellent condition. Minor micro-scratches on back, screen is perfect. Comes with original charger and box. Battery health is at 87%.",
        brand: "Apple", model: "iPhone 12 Pro", age: "1.5 years", colour: "Pacific Blue", warranty: "No", originalPrice: "₹1,19,900",
        seller: defaultUser._id, sellerName: "Priya Verma", sellerInitials: "PV", sellerPhone: "+91 91234 56789", distance: 0.8
      },
      {
        title: 'Dell Inspiron 15" Laptop',
        price: 28000,
        condition: "Good",
        category: "Electronics",
        location: "Aliganj",
        images: [
          "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=85",
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=85",
          "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&q=85"
        ],
        description: "Dell Inspiron laptop with Core i5 processor, 8GB RAM and 512GB SSD. Works perfectly for office work, coding, and everyday tasks. Comes with original charger.",
        brand: "Dell", model: "Inspiron 15", age: "2 years", colour: "Silver", warranty: "3 months remaining", originalPrice: "₹52,000",
        seller: defaultUser._id, sellerName: "Amit Sharma", sellerInitials: "AS", sellerPhone: "+91 99887 76655", distance: 1.5
      },
      {
        title: "Wooden Study Chair",
        price: 3200,
        condition: "Like new",
        category: "Furniture",
        location: "Indira Nagar",
        images: [
          "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=85",
          "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=85",
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=85"
        ],
        description: "Comfortable ergonomic wooden study chair in near-mint condition. Height adjustable and has lumbar support cushion. Perfect for long study or work sessions.",
        brand: "Featherlite", model: "Study Pro", age: "8 months", colour: "Walnut Brown", warranty: "No", originalPrice: "₹7,500",
        seller: defaultUser._id, sellerName: "Sneha Gupta", sellerInitials: "SG", sellerPhone: "+91 98000 11223", distance: 0.5
      },
      {
        title: "IKEA Coffee Table",
        price: 4500,
        condition: "Good",
        category: "Furniture",
        location: "Vikas Nagar",
        images: [
          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=85",
          "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=85",
          "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=85"
        ],
        description: "IKEA LACK coffee table with lower shelf for extra storage. Minor scuff on one leg, otherwise in good condition. Dismantled and ready to pickup.",
        brand: "IKEA", model: "LACK", age: "1 year", colour: "White", warranty: "No", originalPrice: "₹8,999",
        seller: defaultUser._id, sellerName: "Rohan Das", sellerInitials: "RD", sellerPhone: "+91 97777 88888", distance: 1.3
      },
      {
        title: "Nike Air Jordan Shoes (Size 42)",
        price: 6000,
        condition: "Like new",
        category: "Clothing",
        location: "Hazratganj",
        images: [
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=85",
          "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&q=85",
          "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=85"
        ],
        description: "Barely worn Air Jordan 1 Retro. Wore only twice to indoor events. Still looks and smells brand new. Original box included.",
        brand: "Nike", model: "Air Jordan 1", age: "4 months", colour: "White/Black/Red", warranty: "No", originalPrice: "₹11,495",
        seller: defaultUser._id, sellerName: "Aman Khanna", sellerInitials: "AK", sellerPhone: "+91 93456 78901", distance: 1.1
      },
      {
        title: "Levi's 511 Slim Jeans (32x32)",
        price: 1800,
        condition: "Good",
        category: "Clothing",
        location: "Rajajipuram",
        images: [
          "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=85",
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=85",
          "https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=800&q=85"
        ],
        description: "Classic Levi's 511 slim fit jeans in dark wash. Only slight fading, no tears or holes. Washed and ready. Great everyday jeans.",
        brand: "Levi's", model: "511 Slim", age: "1 year", colour: "Dark Indigo", warranty: "No", originalPrice: "₹3,999",
        seller: defaultUser._id, sellerName: "Pooja Singh", sellerInitials: "PS", sellerPhone: "+91 91111 22222", distance: 2.4
      },
      {
        title: "NCERT Class 12 Complete Set",
        price: 800,
        condition: "Good",
        category: "Books",
        location: "Hazratganj",
        images: [
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=85",
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=85",
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=85"
        ],
        description: "Complete set of NCERT textbooks for Class 12 (Physics, Chemistry, Maths, Bio, English). Some books have light pencil notes. Great for JEE/NEET prep.",
        brand: "NCERT", model: "Class 12", age: "1 year", colour: "Various", warranty: "N/A", originalPrice: "₹1,800",
        seller: defaultUser._id, sellerName: "Sneha Gupta", sellerInitials: "SG", sellerPhone: "+91 98000 11223", distance: 0.4
      },
      {
        title: "Atomic Habits — James Clear",
        price: 220,
        condition: "Like new",
        category: "Books",
        location: "Gomti Nagar",
        images: [
          "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=85",
          "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=85",
          "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=85"
        ],
        description: "Atomic Habits hardcover, read once. No dog-ears, no highlighting. One of the best books on habits and self-improvement. Selling because I have a digital copy.",
        brand: "Penguin", model: "Hardcover", age: "5 months", colour: "—", warranty: "N/A", originalPrice: "₹499",
        seller: defaultUser._id, sellerName: "Karan Mehta", sellerInitials: "KM", sellerPhone: "+91 95555 66666", distance: 0.9
      },
      {
        title: 'Trek MTB 21-speed 26"',
        price: 12000,
        condition: "Good",
        category: "Vehicles",
        location: "Aliganj",
        images: [
          "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=85",
          "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&q=85",
          "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=85"
        ],
        description: "Trek Marlin 5 mountain bike with 21-speed Shimano gears. Recently serviced — new brake pads, tires in good shape. Great for city riding and light trails.",
        brand: "Trek", model: "Marlin 5", age: "2 years", colour: "Matte Black", warranty: "No", originalPrice: "₹22,000",
        seller: defaultUser._id, sellerName: "Priya Sharma", sellerInitials: "PS", sellerPhone: "+91 90000 12345", distance: 1.2
      },
      {
        title: "Cosco Football Size 5",
        price: 650,
        condition: "Like new",
        category: "Sports",
        location: "Hazratganj",
        images: [
          "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=800&q=85",
          "https://facts.net/wp-content/uploads/2023/07/16-facts-about-football-1689928910.jpg",
          "https://static.vecteezy.com/system/resources/thumbnails/002/977/419/original/soccer-ball-on-the-football-field-background-free-video.jpg"
        ],
        description: "Cosco match quality football, used only a handful of times at indoor turf. No visible wear. Pumped and ready to play. Great price.",
        brand: "Cosco", model: "Tornado", age: "3 months", colour: "Black & White", warranty: "No", originalPrice: "₹1,200",
        seller: defaultUser._id, sellerName: "Rahul Kumar", sellerInitials: "RK", sellerPhone: "+91 98765 43210", distance: 0.6
      },
      {
        title: "Instant Pot 6 Qt Pressure Cooker",
        price: 4200,
        condition: "Like new",
        category: "Kitchen",
        location: "Indira Nagar",
        images: [
          "https://cb.scene7.com/is/image/Crate/InstantPt6qDPSPrsCkAV2SHS22_VND?$web_pdp_main_carousel_med$",
          "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=85",
          "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=85"
        ],
        description: "Instant Pot 7-in-1 multi-cooker. Used occasionally, always cleaned thoroughly. Comes with original lid, inner pot and all accessories. Works perfectly.",
        brand: "Instant Pot", model: "Duo 6 Qt", age: "9 months", colour: "Stainless Steel", warranty: "1 year remaining", originalPrice: "₹8,995",
        seller: defaultUser._id, sellerName: "Meera Joshi", sellerInitials: "MJ", sellerPhone: "+91 99999 00000", distance: 1.8
      }
    ];

    await Listing.insertMany(seededListings);
    console.log('Seeded database with default listings');
  } catch (err) {
    console.error('Failed to seed listings:', err.message);
  }
};

// ─── Helper: Validate MongoDB ObjectId ──────────────────
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

// ─────────────────────────────────────────────────────────
// @desc    Get all listings
// @route   GET /api/listings
// @access  Public
// ─────────────────────────────────────────────────────────
exports.getListings = async (req, res) => {
  try {
    let listings = await Listing.find().sort({ createdAt: -1 }).lean();

    // Seed only on first empty load, never again
    if (listings.length === 0 && !hasSeeded) {
      await seedListings();
      listings = await Listing.find().sort({ createdAt: -1 }).lean();
    }

    res.json(listings);
  } catch (error) {
    console.error('GET /api/listings error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Get single listing details
// @route   GET /api/listings/:id
// @access  Public
// ─────────────────────────────────────────────────────────
exports.getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid listing ID format' });
    }

    const listing = await Listing.findById(id).lean();
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json(listing);
  } catch (error) {
    console.error('GET /api/listings/:id error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Create a new listing
// @route   POST /api/listings
// @access  Public
// ─────────────────────────────────────────────────────────
exports.createListing = async (req, res) => {
  try {
    const {
      title, description, price, category, condition,
      location, images, seller, sellerName, sellerInitials, sellerPhone
    } = req.body;

    // Validation
    if (!title || !description || !price || !category || !condition || !location || !seller) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (String(req.user.id) !== String(seller)) {
      return res.status(403).json({ message: 'Not authorized to create listing for another user' });
    }

    const newListing = new Listing({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      condition,
      location,
      images: images || [],
      seller,
      sellerName: sellerName || 'Unknown',
      sellerInitials: sellerInitials || sellerName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U',
      sellerPhone: sellerPhone || '',
      distance: Number((Math.random() * 2 + 0.2).toFixed(1))
    });

    const savedListing = await newListing.save();
    console.log(`Created listing: "${savedListing.title}" (${savedListing._id})`);
    res.status(201).json(savedListing);
  } catch (error) {
    console.error('POST /api/listings error:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Update a listing
// @route   PUT /api/listings/:id
// @access  Public
// ─────────────────────────────────────────────────────────
exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid listing ID format' });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (String(listing.seller) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    const { title, description, price, category, condition, location, images, sold } = req.body;

    // Build update object — only include fields that were sent
    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (price !== undefined) update.price = Number(price);
    if (category !== undefined) update.category = category;
    if (condition !== undefined) update.condition = condition;
    if (location !== undefined) update.location = location;
    if (images !== undefined) update.images = images;
    if (sold !== undefined) update.sold = sold;

    const updatedListing = await Listing.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    console.log(`Updated listing: "${updatedListing.title}" (${id})`);
    res.json(updatedListing);
  } catch (error) {
    console.error('PUT /api/listings/:id error:', error.message);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid listing ID format' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// ─────────────────────────────────────────────────────────
// @desc    Delete a listing
// @route   DELETE /api/listings/:id
// @access  Public
// ─────────────────────────────────────────────────────────
exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid listing ID format' });
    }

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    if (String(listing.seller) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    const deletedListing = await Listing.findByIdAndDelete(id);

    console.log(`Deleted listing: "${deletedListing.title}" (${id})`);
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/listings/:id error:', error.message);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid listing ID format' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};
