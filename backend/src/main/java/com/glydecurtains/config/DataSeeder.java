package com.glydecurtains.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glydecurtains.entity.*;
import com.glydecurtains.entity.enums.*;
import com.glydecurtains.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductSpecificationRepository productSpecificationRepository;
    private final ProductVariantRepository productVariantRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final HomepageSectionRepository homepageSectionRepository;
    private final BannerRepository bannerRepository;
    private final StoreLocationRepository storeLocationRepository;
    private final AchievementRepository achievementRepository;
    private final OrderRepository orderRepository;
    private final ActivityLogRepository activityLogRepository;
    private final EnquiryRepository enquiryRepository;
    private final FeedbackRepository feedbackRepository;

    private final InvoiceSettingsRepository invoiceSettingsRepository;
    private final SiteSettingsRepository siteSettingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already seeded, skipping...");
            return;
        }
        log.info("Seeding database with initial data...");
        seedSuperAdmin();
        seedDemoCustomer();
        seedDemoEmployees();
        seedCategories();
        seedProducts();
        seedSampleDataFile();
        seedDemoOrdersAndActivity();
        seedPermissions();
        seedHomepageSections();
        seedStoreLocations();
        seedAchievements();
        seedInvoiceSettings();
        seedSiteSettings();
        log.info("Database seeding completed.");
    }

    private void seedSuperAdmin() {
        User admin = new User();
        admin.setName("Super Admin");
        admin.setEmail("admin@glydecurtains.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(UserRole.SUPER_ADMIN);
        admin.setStatus(UserStatus.APPROVED);
        admin.setPasswordChangedAt(null);
        userRepository.save(admin);
        log.info("Super Admin account created.");
    }

    private void seedDemoCustomer() {
        User customer = new User();
        customer.setName("DK");
        customer.setEmail("dk@glydecurtains.com");
        customer.setPassword(passwordEncoder.encode("dk"));
        customer.setRole(UserRole.CUSTOMER);
        customer.setStatus(UserStatus.APPROVED);
        userRepository.save(customer);
        log.info("Demo customer account created.");
    }

    private void seedSampleDataFile() {
        try {
            Resource resource = resourceLoader.getResource("classpath:sample-data/demo-seed.json");
            if (!resource.exists()) {
                log.info("No sample data file found at classpath:sample-data/demo-seed.json");
                return;
            }

            SampleSeedFile sampleSeed = objectMapper.readValue(resource.getInputStream(), SampleSeedFile.class);
            if (sampleSeed == null) {
                return;
            }

            if (sampleSeed.getEmployees() != null) {
                for (SampleSeedUser employee : sampleSeed.getEmployees()) {
                    if (employee == null || employee.getEmail() == null || employee.getEmail().isBlank()) {
                        continue;
                    }
                    if (userRepository.existsByEmailIgnoreCase(employee.getEmail())) {
                        continue;
                    }
                    User user = new User();
                    user.setName(employee.getName());
                    user.setEmail(employee.getEmail());
                    user.setPassword(passwordEncoder.encode(employee.getPassword() == null ? "demo123" : employee.getPassword()));
                    user.setRole(UserRole.EMPLOYEE);
                    user.setStatus(UserStatus.APPROVED);
                    userRepository.save(user);
                }
            }

            if (sampleSeed.getStoreLocations() != null) {
                for (SampleStoreLocation location : sampleSeed.getStoreLocations()) {
                    if (location == null || location.getName() == null || location.getName().isBlank()) {
                        continue;
                    }
                    boolean exists = storeLocationRepository.findAll().stream()
                            .anyMatch(item -> item.getName().equalsIgnoreCase(location.getName()));
                    if (exists) {
                        continue;
                    }
                    StoreLocation storeLocation = new StoreLocation();
                    storeLocation.setName(location.getName());
                    storeLocation.setAddress(location.getAddress());
                    storeLocation.setCity(location.getCity());
                    storeLocation.setState(location.getState());
                    storeLocation.setPhone(location.getPhone());
                    storeLocation.setEmail(location.getEmail());
                    storeLocation.setLatitude(location.getLatitude());
                    storeLocation.setLongitude(location.getLongitude());
                    storeLocation.setOperatingHours(location.getOperatingHours());
                    storeLocation.setImageBase64(location.getImageBase64());
                    storeLocation.setIsActive(true);
                    storeLocationRepository.save(storeLocation);
                }
            }

            if (sampleSeed.getEnquiries() != null) {
                for (SampleEnquiry enquirySeed : sampleSeed.getEnquiries()) {
                    if (enquirySeed == null || enquirySeed.getEmail() == null || enquirySeed.getEmail().isBlank()) {
                        continue;
                    }
                    Enquiry enquiry = new Enquiry();
                    enquiry.setName(enquirySeed.getName());
                    enquiry.setEmail(enquirySeed.getEmail());
                    enquiry.setPhone(enquirySeed.getPhone());
                    enquiry.setSubject(enquirySeed.getSubject());
                    enquiry.setMessage(enquirySeed.getMessage());
                    enquiry.setStatus(enquirySeed.getStatus() == null ? EnquiryStatus.NEW : EnquiryStatus.valueOf(enquirySeed.getStatus()));
                    enquiryRepository.save(enquiry);
                }
            }

            if (sampleSeed.getFeedback() != null) {
                for (SampleFeedback feedbackSeed : sampleSeed.getFeedback()) {
                    if (feedbackSeed == null || feedbackSeed.getUserEmail() == null || feedbackSeed.getUserEmail().isBlank()) {
                        continue;
                    }
                    User reviewer = userRepository.findByEmailIgnoreCase(feedbackSeed.getUserEmail()).orElse(null);
                    Product product = feedbackSeed.getProductSku() == null ? null : productRepository.findBySku(feedbackSeed.getProductSku()).orElse(null);
                    if (reviewer == null || product == null) {
                        continue;
                    }

                    boolean duplicate = feedbackRepository.findAll().stream()
                            .anyMatch(item -> item.getUserId().equals(reviewer.getId()) && item.getProductId() != null && item.getProductId().equals(product.getId()));
                    if (duplicate) {
                        continue;
                    }

                    Feedback feedback = new Feedback();
                    feedback.setUserId(reviewer.getId());
                    feedback.setProductId(product.getId());
                    feedback.setRating(feedbackSeed.getRating());
                    feedback.setTitle(feedbackSeed.getTitle());
                    feedback.setComment(feedbackSeed.getComment());
                    feedback.setStatus(feedbackSeed.getStatus() == null ? FeedbackStatus.APPROVED : FeedbackStatus.valueOf(feedbackSeed.getStatus()));
                    feedbackRepository.save(feedback);
                }
            }

            log.info("Sample data loaded from sample-data/demo-seed.json");
        } catch (IOException e) {
            log.warn("Unable to load sample seed file", e);
        }
    }

    private void seedDemoEmployees() {
        String[] names = {"Nisha Patel", "Rohan Mehta", "Aarav Shah", "Mira Joshi"};
        for (int i = 0; i < names.length; i++) {
            User employee = new User();
            employee.setName(names[i]);
            employee.setEmail("emp" + (i + 1) + "@glydecurtains.com");
            employee.setPassword(passwordEncoder.encode("emp123"));
            employee.setRole(UserRole.EMPLOYEE);
            employee.setStatus(UserStatus.APPROVED);
            employee = userRepository.save(employee);
            setCreatedAtForTable("users", employee.getId(), LocalDateTime.now().minusDays(12 + i));
        }
        log.info("Demo employee accounts created.");
    }

    private void seedCategories() {
        Category curtains = createCategory("Curtains", "Premium quality curtains for every room", 1);
        Category rods = createCategory("Curtain Rods", "Durable and stylish curtain rods", 2);
        Category tracks = createCategory("Tracks", "Smooth-glide curtain track systems", 3);
        Category accessories = createCategory("Accessories", "Essential curtain accessories and hardware", 4);
        Category blindsAcc = createCategory("Blinds Accessories", "Accessories for blinds and shades", 5);

        // Curtains sub-categories
        createSubCategory("Blackout Curtains", curtains.getId(), 1);
        createSubCategory("Sheer Curtains", curtains.getId(), 2);
        createSubCategory("Velvet Curtains", curtains.getId(), 3);
        createSubCategory("Cotton Curtains", curtains.getId(), 4);
        createSubCategory("Linen Curtains", curtains.getId(), 5);

        // Curtain Rods sub-categories
        createSubCategory("Metal Rods", rods.getId(), 1);
        createSubCategory("Wooden Rods", rods.getId(), 2);
        createSubCategory("Extendable Rods", rods.getId(), 3);

        // Tracks sub-categories
        createSubCategory("Ceiling Tracks", tracks.getId(), 1);
        createSubCategory("Wall Tracks", tracks.getId(), 2);
        createSubCategory("Motorized Tracks", tracks.getId(), 3);

        // Accessories sub-categories
        createSubCategory("Tiebacks", accessories.getId(), 1);
        createSubCategory("Hooks & Rings", accessories.getId(), 2);
        createSubCategory("Brackets", accessories.getId(), 3);
        createSubCategory("Finials", accessories.getId(), 4);

        // Blinds Accessories sub-categories
        createSubCategory("Blind Chains", blindsAcc.getId(), 1);
        createSubCategory("Blind Brackets", blindsAcc.getId(), 2);
        createSubCategory("Control Mechanisms", blindsAcc.getId(), 3);

        log.info("Categories and sub-categories seeded.");
    }

    private Category createCategory(String name, String description, int sortOrder) {
        return categoryRepository.findByNameIgnoreCase(name).orElseGet(() -> {
            Category cat = new Category();
            cat.setName(name);
            cat.setDescription(description);
            cat.setSortOrder(sortOrder);
            cat.setIsVisible(true);
            cat.setIsActive(true);
            return categoryRepository.save(cat);
        });
    }

    private SubCategory createSubCategory(String name, Long categoryId, int sortOrder) {
        SubCategory sub = new SubCategory();
        sub.setName(name);
        sub.setCategoryId(categoryId);
        sub.setSortOrder(sortOrder);
        sub.setIsActive(true);
        return subCategoryRepository.save(sub);
    }

    private void seedProducts() {
        Category curtains = categoryRepository.findAll().stream()
                .filter(c -> c.getName().equals("Curtains")).findFirst().orElseThrow();
        Category rods = categoryRepository.findAll().stream()
                .filter(c -> c.getName().equals("Curtain Rods")).findFirst().orElseThrow();
        Category tracks = categoryRepository.findAll().stream()
                .filter(c -> c.getName().equals("Tracks")).findFirst().orElseThrow();
        Category accessories = categoryRepository.findAll().stream()
                .filter(c -> c.getName().equals("Accessories")).findFirst().orElseThrow();

        // 3 Curtain products
        Product p1 = createProduct("Royal Velvet Blackout Curtain", "GC-CUR-001",
                curtains.getId(), "Luxurious velvet blackout curtain with thermal insulation",
                "Experience ultimate darkness and comfort with our Royal Velvet Blackout Curtain. Crafted from premium quality velvet fabric, these curtains block 99% of light while providing excellent thermal insulation.",
                "Velvet", "Solid", BigDecimal.valueOf(2499.00), 50, true, false, true, false, true);
        addProductSpec(p1, "Material", "Premium Velvet", 1);
        addProductSpec(p1, "Light Blocking", "99%", 2);
        addProductSpec(p1, "Thermal Insulation", "Yes", 3);
        addProductSpec(p1, "Care Instructions", "Dry clean only", 4);
        addProductVariant(p1, "Velvet", "7ft", "Burgundy", BigDecimal.valueOf(2499.00), 15);
        addProductVariant(p1, "Velvet", "7ft", "Navy Blue", BigDecimal.valueOf(2499.00), 15);
        addProductVariant(p1, "Velvet", "9ft", "Burgundy", BigDecimal.valueOf(2999.00), 10);
        addProductVariant(p1, "Velvet", "9ft", "Navy Blue", BigDecimal.valueOf(2999.00), 10);
        addProductImage(p1, SAMPLE_IMAGE_CURTAIN, "royal-velvet-curtain.jpg");

        Product p2 = createProduct("Elegant Sheer White Curtain", "GC-CUR-002",
                curtains.getId(), "Lightweight sheer curtain for a breezy, elegant look",
                "Transform your space with our Elegant Sheer White Curtain. The delicate fabric allows soft natural light to filter through while maintaining privacy. Perfect for living rooms and bedrooms.",
                "Polyester Voile", "Plain Sheer", BigDecimal.valueOf(899.00), 80, false, true, true, false, false);
        addProductSpec(p2, "Material", "Polyester Voile", 1);
        addProductSpec(p2, "Transparency", "Semi-transparent", 2);
        addProductSpec(p2, "Care Instructions", "Machine wash cold", 3);
        addProductVariant(p2, "Voile", "5ft", "White", BigDecimal.valueOf(899.00), 30);
        addProductVariant(p2, "Voile", "7ft", "White", BigDecimal.valueOf(1099.00), 25);
        addProductVariant(p2, "Voile", "7ft", "Ivory", BigDecimal.valueOf(1099.00), 25);
        addProductImage(p2, SAMPLE_IMAGE_CURTAIN, "sheer-white-curtain.jpg");

        Product p3 = createProduct("Heritage Cotton Printed Curtain", "GC-CUR-003",
                curtains.getId(), "Traditional printed cotton curtain with floral motifs",
                "Bring warmth and character to your home with our Heritage Cotton Printed Curtain. Features hand-inspired floral prints on premium cotton fabric. Available in multiple colour combinations.",
                "Cotton", "Floral Print", BigDecimal.valueOf(1599.00), 45, false, false, false, true, false);
        addProductSpec(p3, "Material", "100% Cotton", 1);
        addProductSpec(p3, "Pattern", "Floral Print", 2);
        addProductSpec(p3, "Light Blocking", "70%", 3);
        addProductSpec(p3, "Care Instructions", "Machine wash gentle", 4);
        addProductVariant(p3, "Cotton", "7ft", "Green Floral", BigDecimal.valueOf(1599.00), 15);
        addProductVariant(p3, "Cotton", "7ft", "Blue Floral", BigDecimal.valueOf(1599.00), 15);
        addProductVariant(p3, "Cotton", "9ft", "Green Floral", BigDecimal.valueOf(1899.00), 15);
        addProductImage(p3, SAMPLE_IMAGE_CURTAIN, "cotton-printed-curtain.jpg");

        // 2 Rod products
        Product p4 = createProduct("Classic Brass Curtain Rod", "GC-ROD-001",
                rods.getId(), "Elegant brass-finish metal curtain rod with decorative finials",
                "Add a touch of sophistication with our Classic Brass Curtain Rod. Made from high-grade steel with a premium brass finish. Includes matching brackets and decorative ball finials.",
                "Steel with Brass Finish", "Classic", BigDecimal.valueOf(1299.00), 35, true, false, false, false, true);
        addProductSpec(p4, "Material", "Steel with Brass Finish", 1);
        addProductSpec(p4, "Diameter", "25mm", 2);
        addProductSpec(p4, "Weight Capacity", "15 kg", 3);
        addProductSpec(p4, "Finials Included", "Yes - Ball Finials", 4);
        addProductVariant(p4, "Steel/Brass", "4ft", "Antique Brass", BigDecimal.valueOf(1299.00), 12);
        addProductVariant(p4, "Steel/Brass", "6ft", "Antique Brass", BigDecimal.valueOf(1599.00), 12);
        addProductVariant(p4, "Steel/Brass", "8ft", "Antique Brass", BigDecimal.valueOf(1899.00), 11);
        addProductImage(p4, SAMPLE_IMAGE_ROD, "brass-curtain-rod.jpg");

        Product p5 = createProduct("Modern Matte Black Rod", "GC-ROD-002",
                rods.getId(), "Sleek matte black extendable curtain rod for modern interiors",
                "Achieve a contemporary look with our Modern Matte Black Rod. Features a smooth matte finish with silent-glide technology. Extendable design fits various window widths without cutting.",
                "Iron with Powder Coating", "Modern Minimal", BigDecimal.valueOf(999.00), 60, false, true, true, false, false);
        addProductSpec(p5, "Material", "Iron with Powder Coating", 1);
        addProductSpec(p5, "Diameter", "22mm", 2);
        addProductSpec(p5, "Extendable", "Yes", 3);
        addProductSpec(p5, "Weight Capacity", "12 kg", 4);
        addProductVariant(p5, "Iron", "3-5ft", "Matte Black", BigDecimal.valueOf(999.00), 20);
        addProductVariant(p5, "Iron", "5-8ft", "Matte Black", BigDecimal.valueOf(1399.00), 20);
        addProductVariant(p5, "Iron", "5-8ft", "Matte White", BigDecimal.valueOf(1399.00), 20);
        addProductImage(p5, SAMPLE_IMAGE_ROD, "matte-black-rod.jpg");

        // 2 Track products
        Product p6 = createProduct("Premium Ceiling Mount Track", "GC-TRK-001",
                tracks.getId(), "Heavy-duty aluminium ceiling-mounted curtain track",
                "Our Premium Ceiling Mount Track offers smooth, silent operation for heavy curtains. Made from extruded aluminium with nylon gliders. Bendable for bay windows. Supports curtains up to 20 kg.",
                "Aluminium", "Straight/Bendable", BigDecimal.valueOf(1799.00), 25, true, false, false, false, true);
        addProductSpec(p6, "Material", "Extruded Aluminium", 1);
        addProductSpec(p6, "Mount Type", "Ceiling", 2);
        addProductSpec(p6, "Weight Capacity", "20 kg", 3);
        addProductSpec(p6, "Bendable", "Yes - for bay windows", 4);
        addProductVariant(p6, "Aluminium", "2m", "White", BigDecimal.valueOf(1799.00), 10);
        addProductVariant(p6, "Aluminium", "3m", "White", BigDecimal.valueOf(2299.00), 8);
        addProductVariant(p6, "Aluminium", "3m", "Silver", BigDecimal.valueOf(2299.00), 7);
        addProductImage(p6, SAMPLE_IMAGE_TRACK, "ceiling-mount-track.jpg");

        Product p7 = createProduct("Motorized Smart Track System", "GC-TRK-002",
                tracks.getId(), "App-controlled motorized curtain track with quiet motor",
                "Automate your curtains with our Motorized Smart Track System. Features whisper-quiet motor, remote control, and mobile app integration. Schedule open/close times for convenience and energy savings.",
                "Aluminium with Motor Unit", "Smart Home", BigDecimal.valueOf(5999.00), 15, true, true, true, false, true);
        addProductSpec(p7, "Material", "Aluminium + ABS Motor Housing", 1);
        addProductSpec(p7, "Motor Type", "DC Quiet Motor", 2);
        addProductSpec(p7, "Control", "Remote + Mobile App", 3);
        addProductSpec(p7, "Weight Capacity", "25 kg", 4);
        addProductVariant(p7, "Aluminium/Motor", "3m", "White", BigDecimal.valueOf(5999.00), 5);
        addProductVariant(p7, "Aluminium/Motor", "4m", "White", BigDecimal.valueOf(6999.00), 5);
        addProductVariant(p7, "Aluminium/Motor", "5m", "White", BigDecimal.valueOf(7999.00), 5);
        addProductImage(p7, SAMPLE_IMAGE_TRACK, "motorized-smart-track.jpg");

        // 2 Accessory products
        Product p8 = createProduct("Crystal Curtain Tieback Set", "GC-ACC-001",
                accessories.getId(), "Decorative crystal tieback pair for elegant draping",
                "Elevate your curtain styling with our Crystal Curtain Tieback Set. Each pair features hand-set crystal beads on a flexible metal band. Creates a beautiful gathered effect while letting light in.",
                "Metal with Crystal Beads", "Decorative", BigDecimal.valueOf(699.00), 40, false, true, false, true, false);
        addProductSpec(p8, "Material", "Metal Wire + Crystal Beads", 1);
        addProductSpec(p8, "Length", "60cm each", 2);
        addProductSpec(p8, "Quantity", "1 Pair (2 pieces)", 3);
        addProductVariant(p8, "Crystal/Metal", "Standard", "Clear Crystal", BigDecimal.valueOf(699.00), 20);
        addProductVariant(p8, "Crystal/Metal", "Standard", "Amber Crystal", BigDecimal.valueOf(699.00), 20);
        addProductImage(p8, SAMPLE_IMAGE_ACCESSORY, "crystal-tieback-set.jpg");

        Product p9 = createProduct("Heavy Duty Wall Bracket Set", "GC-ACC-002",
                accessories.getId(), "Industrial-strength wall brackets for curtain rods",
                "Secure your curtain rods with confidence using our Heavy Duty Wall Bracket Set. Crafted from solid iron with a premium powder-coated finish. Includes all mounting hardware.",
                "Solid Iron", "Industrial", BigDecimal.valueOf(449.00), 100, false, false, true, false, false);
        addProductSpec(p9, "Material", "Solid Iron - Powder Coated", 1);
        addProductSpec(p9, "Rod Diameter Fit", "22-28mm", 2);
        addProductSpec(p9, "Quantity", "Set of 3", 3);
        addProductSpec(p9, "Mounting Hardware", "Included", 4);
        addProductVariant(p9, "Iron", "22mm fit", "Matte Black", BigDecimal.valueOf(449.00), 35);
        addProductVariant(p9, "Iron", "28mm fit", "Matte Black", BigDecimal.valueOf(499.00), 35);
        addProductVariant(p9, "Iron", "28mm fit", "Antique Bronze", BigDecimal.valueOf(499.00), 30);
        addProductImage(p9, SAMPLE_IMAGE_ACCESSORY, "wall-bracket-set.jpg");

        log.info("Products seeded with specs, variants, and images.");
    }

    private Product createProduct(String name, String sku, Long categoryId, String shortDesc,
                                  String longDesc, String material, String pattern,
                                  BigDecimal basePrice, int stock,
                                  boolean featured, boolean trending, boolean newArrival,
                                  boolean bestSeller, boolean premium) {
        Product p = new Product();
        p.setName(name);
        p.setSku(sku);
        p.setCategoryId(categoryId);
        p.setShortDescription(shortDesc);
        p.setLongDescription(longDesc);
        p.setMaterial(material);
        p.setPattern(pattern);
        p.setBasePrice(basePrice);
        p.setStockQuantity(stock);
        p.setStatus(ProductStatus.ACTIVE);
        p.setIsFeatured(featured);
        p.setIsTrending(trending);
        p.setIsNewArrival(newArrival);
        p.setIsBestSeller(bestSeller);
        p.setIsPremium(premium);
        p.setDiscountPercentage(BigDecimal.ZERO);
        return productRepository.save(p);
    }

    private void addProductSpec(Product product, String key, String value, int order) {
        ProductSpecification spec = new ProductSpecification();
        spec.setProduct(product);
        spec.setSpecKey(key);
        spec.setSpecValue(value);
        spec.setSortOrder(order);
        productSpecificationRepository.save(spec);
    }

    private void addProductVariant(Product product, String material, String size,
                                   String color, BigDecimal price, int stock) {
        ProductVariant v = new ProductVariant();
        v.setProduct(product);
        v.setMaterial(material);
        v.setSize(size);
        v.setColor(color);
        v.setPrice(price);
        v.setStockQuantity(stock);
        productVariantRepository.save(v);
    }

    private void addProductImage(Product product, String base64Data, String filename) {
        ProductImage img = new ProductImage();
        img.setProduct(product);
        img.setBase64Data(base64Data);
        img.setMimeType("image/jpeg");
        img.setMediaType(MediaType.IMAGE);
        img.setOriginalFilename(filename);
        img.setIsThumbnail(true);
        img.setSortOrder(0);
        productImageRepository.save(img);
    }

    private void seedDemoOrdersAndActivity() {
        if (orderRepository.count() > 0) {
            return;
        }

        List<User> customers = userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.CUSTOMER)
                .toList();

        List<User> employees = userRepository.findAll().stream()
                .filter(user -> user.getRole() == UserRole.EMPLOYEE)
                .toList();

        List<Product> products = productRepository.findAll();
        if (customers.isEmpty() || employees.isEmpty() || products.isEmpty()) {
            return;
        }

        String[] orderNumbers = {
                "GC-20260901-1001", "GC-20260903-1002", "GC-20260905-1003", "GC-20260907-1004",
                "GC-20260909-1005", "GC-20260912-1006", "GC-20260914-1007", "GC-20260918-1008"
        };

        OrderStatus[] statuses = {
                OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.PACKED,
                OrderStatus.DISPATCHED, OrderStatus.DELIVERED, OrderStatus.CONFIRMED,
                OrderStatus.DELIVERED, OrderStatus.PENDING
        };

        BigDecimal[] totals = {
                new BigDecimal("4899.00"), new BigDecimal("3820.00"), new BigDecimal("2399.00"), new BigDecimal("7240.00"),
                new BigDecimal("5680.00"), new BigDecimal("3190.00"), new BigDecimal("6499.00"), new BigDecimal("1980.00")
        };

        for (int i = 0; i < orderNumbers.length; i++) {
            User customer = customers.get(i % customers.size());
            User employee = employees.get(i % employees.size());
            Product product = products.get(i % products.size());
            Order order = new Order();
            order.setOrderNumber(orderNumbers[i]);
            order.setUserId(customer.getId());
            order.setStatus(statuses[i]);
            order.setSubtotal(totals[i]);
            order.setGrandTotal(totals[i]);
            order.setAssignedEmployeeId(employee.getId());

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProductId(product.getId());
            item.setProductName(product.getName());
            item.setQuantity(1 + (i % 3));
            item.setUnitPrice(product.getBasePrice());
            item.setSubtotal(product.getBasePrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            order.getItems().add(item);

            OrderStatusHistory history = new OrderStatusHistory();
            history.setOrder(order);
            history.setFromStatus(i == 0 ? null : statuses[Math.max(0, i - 1)]);
            history.setToStatus(statuses[i]);
            history.setChangedBy(employee.getId());
            history.setNotes("Sample order seeded for demo dashboard");
            history.setChangedAt(LocalDateTime.now().minusDays(12 - i).minusHours(i + 1));
            order.getStatusHistory().add(history);

            orderRepository.save(order);
            setCreatedAtForTable("orders", order.getId(), LocalDateTime.now().minusDays(12 - i));

            ActivityLog logEntry = ActivityLog.builder()
                    .userId(customer.getId())
                    .actionType("ORDER_PLACED")
                    .entityType("order")
                    .entityId(order.getId())
                    .details("[DEMO] Order " + order.getOrderNumber() + " placed for Rs. " + totals[i])
                    .ipAddress("10.0.0." + (i + 5))
                    .timestamp(LocalDateTime.now().minusDays(12 - i).minusHours(2))
                    .build();
            activityLogRepository.save(logEntry);
        }

        List<User> seedUsers = new ArrayList<>(customers);
        for (int i = 0; i < 10; i++) {
            User customer = new User();
            customer.setName("Sample Customer " + (i + 1));
            customer.setEmail("samplecustomer" + (i + 1) + "@glydecurtains.com");
            customer.setPassword(passwordEncoder.encode("demo123"));
            customer.setRole(UserRole.CUSTOMER);
            customer.setStatus(UserStatus.APPROVED);
            customer = userRepository.save(customer);
            setCreatedAtForTable("users", customer.getId(), LocalDateTime.now().minusDays(25 - i));
            seedUsers.add(customer);
        }

        log.info("Demo order and activity seed data created for dashboard charts.");
    }

    private void setCreatedAtForTable(String tableName, Long entityId, LocalDateTime createdAt) {
        entityManager.createNativeQuery(
                        "UPDATE " + tableName + " SET created_at = :createdAt, updated_at = :createdAt WHERE id = :entityId")
                .setParameter("createdAt", createdAt)
                .setParameter("entityId", entityId)
                .executeUpdate();
    }

    private void seedPermissions() {
        String[] entities = {"products", "categories", "orders", "users", "employees",
                "feedback", "enquiries", "cms", "store_locations", "achievements",
                "permissions", "invoices", "dashboard", "reports", "inventory"};
        String[] operations = {"CREATE", "READ", "UPDATE", "DELETE"};

        // Create all permissions
        for (String entity : entities) {
            for (String operation : operations) {
                Permission perm = permissionRepository.findByEntityAndOperation(entity, operation)
                        .orElseGet(() -> permissionRepository.save(new Permission(entity, operation)));
                // Grant all to SUPER_ADMIN
                rolePermissionRepository.save(new RolePermission(UserRole.SUPER_ADMIN, perm, true));
            }
        }

        // Grant Admin READ on dashboard and reports by default
        permissionRepository.findByEntityAndOperation("dashboard", "READ")
                .ifPresent(p -> rolePermissionRepository.save(new RolePermission(UserRole.ADMIN, p, true)));
        permissionRepository.findByEntityAndOperation("reports", "READ")
                .ifPresent(p -> rolePermissionRepository.save(new RolePermission(UserRole.ADMIN, p, true)));

        // Grant Admin CRUD on inventory by default
        for (String operation : operations) {
            permissionRepository.findByEntityAndOperation("inventory", operation)
                    .ifPresent(p -> rolePermissionRepository.save(new RolePermission(UserRole.ADMIN, p, true)));
        }

        log.info("Permissions seeded for all entities including invoices, dashboard, reports, and inventory.");
    }

    private void seedHomepageSections() {
        int order = 1;
        HomepageSection hero = createSection(SectionType.HERO_BANNER, "Welcome to Glyde Curtains", order++);
        createSection(SectionType.SCROLLING_TICKER, "Announcements", order++);
        createSection(SectionType.POPULAR_CATEGORIES, "Popular Categories", order++);
        createSection(SectionType.FEATURED, "Featured Products", order++);
        createSection(SectionType.RECENTLY_ADDED, "Recently Added", order++);
        createSection(SectionType.FOOTER, "Footer", order);

        // Add a compact set of hero banners to keep the homepage polished and short.
        addBanner(hero, "Transform Your Space", "Premium curtains crafted for elegance and comfort",
                SAMPLE_BANNER_IMAGE, "Shop Now", "/products", 1);
        addBanner(hero, "New Collection Arrived", "Discover our latest designer curtain range",
                SAMPLE_BANNER_IMAGE, "Explore", "/products?filter=new", 2);

        log.info("Homepage sections and banners seeded with a compact storefront layout.");
    }

    private HomepageSection createSection(SectionType type, String title, int sortOrder) {
        HomepageSection section = new HomepageSection();
        section.setSectionType(type);
        section.setTitle(title);
        section.setIsEnabled(true);
        section.setSortOrder(sortOrder);
        return homepageSectionRepository.save(section);
    }

    private void addBanner(HomepageSection section, String title, String subtitle,
                           String imageBase64, String buttonText, String buttonLink, int sortOrder) {
        Banner banner = new Banner();
        banner.setSection(section);
        banner.setTitle(title);
        banner.setSubtitle(subtitle);
        banner.setImageBase64(imageBase64);
        banner.setButtonText(buttonText);
        banner.setButtonLink(buttonLink);
        banner.setSortOrder(sortOrder);
        banner.setIsActive(true);
        bannerRepository.save(banner);
    }

    private void seedStoreLocations() {
        createStore("Glyde Curtains - Ahmedabad Showroom",
                "Shop 12, Premium Mall, S.G. Highway", "Ahmedabad", "Gujarat",
                "+91 79 2345 6789", "ahmedabad@glydecurtains.com",
                23.0225, 72.5714);
        createStore("Glyde Curtains - Mumbai Store",
                "Unit 5, Western Plaza, Andheri West", "Mumbai", "Maharashtra",
                "+91 22 3456 7890", "mumbai@glydecurtains.com",
                19.1364, 72.8296);
        createStore("Glyde Curtains - Delhi Experience Centre",
                "Block A, South Extension Part 2", "New Delhi", "Delhi",
                "+91 11 4567 8901", "delhi@glydecurtains.com",
                28.5721, 77.2218);

        log.info("Store locations seeded.");
    }

    private void createStore(String name, String address, String city, String state,
                             String phone, String email, double lat, double lng) {
        StoreLocation store = new StoreLocation();
        store.setName(name);
        store.setAddress(address);
        store.setCity(city);
        store.setState(state);
        store.setPhone(phone);
        store.setEmail(email);
        store.setLatitude(lat);
        store.setLongitude(lng);
        store.setOperatingHours("{\"monday\":\"10:00-20:00\",\"tuesday\":\"10:00-20:00\",\"wednesday\":\"10:00-20:00\",\"thursday\":\"10:00-20:00\",\"friday\":\"10:00-20:00\",\"saturday\":\"10:00-21:00\",\"sunday\":\"11:00-18:00\"}");
        store.setIsActive(true);
        storeLocationRepository.save(store);
    }

    private void seedAchievements() {
        createAchievement("Happy Customers", "Customers who trust us for their home decor needs",
                2018, "10000+", MetricFormat.NUMERIC_SUFFIX, 1);
        createAchievement("Products Delivered", "Successful deliveries across India",
                2019, "50000+", MetricFormat.NUMERIC_SUFFIX, 2);
        createAchievement("Years of Excellence", "Serving quality curtains and home decor",
                2015, "9+", MetricFormat.NUMERIC_SUFFIX, 3);
        createAchievement("Cities Served", "Delivering across major Indian cities",
                2020, "150+", MetricFormat.NUMERIC_SUFFIX, 4);
        createAchievement("Customer Satisfaction", "Based on verified customer reviews",
                2023, "98%", MetricFormat.PERCENTAGE, 5);

        log.info("Achievements seeded.");
    }

    private void createAchievement(String title, String description, int year,
                                   String metricValue, MetricFormat format, int sortOrder) {
        Achievement a = new Achievement();
        a.setTitle(title);
        a.setDescription(description);
        a.setYear(year);
        a.setMetricValue(metricValue);
        a.setMetricFormat(format);
        a.setSortOrder(sortOrder);
        a.setIsEnabled(true);
        achievementRepository.save(a);
    }

    private void seedInvoiceSettings() {
        InvoiceSettings settings = new InvoiceSettings();
        settings.setCompanyName("Glyde Curtains");
        settings.setCompanyAddress("S.G. Highway, Ahmedabad, Gujarat 380054, India");
        settings.setCompanyPhone("+91 79 2345 6789");
        settings.setCompanyEmail("billing@glydecurtains.com");
        settings.setFooterText("Thank you for shopping with Glyde Curtains!");
        settings.setTermsText("All products are subject to our return policy. Returns accepted within 7 days of delivery for unused items in original packaging.");
        settings.setNumberFormat("INV-{YYYYMMDD}-{NNNN}");
        settings.setIncludeLogoOnInvoice(true);
        settings.setEnableCustomerDownload(true);
        settings.setNextSequenceNumber(1);
        invoiceSettingsRepository.save(settings);
        log.info("Invoice settings seeded.");
    }

    private void seedSiteSettings() {
        SiteSettings settings = new SiteSettings();
        settings.setContactEmail("info@glydecurtains.com");
        settings.setContactPhone("+91 79 2345 6789");
        settings.setAddress("S.G. Highway, Ahmedabad, Gujarat 380054, India");
        settings.setSocialLinks("{\"facebook\":\"https://facebook.com/glydecurtains\",\"instagram\":\"https://instagram.com/glydecurtains\",\"twitter\":\"https://twitter.com/glydecurtains\",\"pinterest\":\"https://pinterest.com/glydecurtains\"}");
        settings.setAnnouncementBar("Free shipping on orders above ₹2000 | Use code WELCOME10 for 10% off your first order");
        siteSettingsRepository.save(settings);
        log.info("Site settings seeded.");
    }

    // Minimal valid 1x1 JPEG images encoded as Base64 (placeholder thumbnails)
    private static final String SAMPLE_IMAGE_CURTAIN =
            "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof"
            + "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwh"
            + "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAAR"
            + "CAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAA"
            + "AAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMR"
            + "AD8AKwA//9k=";

    private static final String SAMPLE_IMAGE_ROD =
            "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof"
            + "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwh"
            + "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAAR"
            + "CAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAA"
            + "AAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMR"
            + "AD8AKwA//9k=";

    private static final String SAMPLE_IMAGE_TRACK =
            "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof"
            + "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwh"
            + "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAAR"
            + "CAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAA"
            + "AAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMR"
            + "AD8AKwA//9k=";

    private static final String SAMPLE_IMAGE_ACCESSORY =
            "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof"
            + "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwh"
            + "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAAR"
            + "CAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAA"
            + "AAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMR"
            + "AD8AKwA//9k=";

    private static final String SAMPLE_BANNER_IMAGE =
            "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRof"
            + "Hh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwh"
            + "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAAR"
            + "CAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAA"
            + "AAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMR"
            + "AD8AKwA//9k=";

    private static class SampleSeedFile {
        private List<SampleSeedUser> employees;
        private List<SampleStoreLocation> storeLocations;
        private List<SampleEnquiry> enquiries;
        private List<SampleFeedback> feedback;

        public List<SampleSeedUser> getEmployees() { return employees; }
        public void setEmployees(List<SampleSeedUser> employees) { this.employees = employees; }
        public List<SampleStoreLocation> getStoreLocations() { return storeLocations; }
        public void setStoreLocations(List<SampleStoreLocation> storeLocations) { this.storeLocations = storeLocations; }
        public List<SampleEnquiry> getEnquiries() { return enquiries; }
        public void setEnquiries(List<SampleEnquiry> enquiries) { this.enquiries = enquiries; }
        public List<SampleFeedback> getFeedback() { return feedback; }
        public void setFeedback(List<SampleFeedback> feedback) { this.feedback = feedback; }
    }

    private static class SampleSeedUser {
        private String name;
        private String email;
        private String password;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    private static class SampleStoreLocation {
        private String name;
        private String address;
        private String city;
        private String state;
        private String phone;
        private String email;
        private Double latitude;
        private Double longitude;
        private String operatingHours;
        private String imageBase64;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getState() { return state; }
        public void setState(String state) { this.state = state; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }
        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }
        public String getOperatingHours() { return operatingHours; }
        public void setOperatingHours(String operatingHours) { this.operatingHours = operatingHours; }
        public String getImageBase64() { return imageBase64; }
        public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }
    }

    private static class SampleEnquiry {
        private String name;
        private String email;
        private String phone;
        private String subject;
        private String message;
        private String status;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    private static class SampleFeedback {
        private String userEmail;
        private String productSku;
        private Integer rating;
        private String title;
        private String comment;
        private String status;

        public String getUserEmail() { return userEmail; }
        public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
        public String getProductSku() { return productSku; }
        public void setProductSku(String productSku) { this.productSku = productSku; }
        public Integer getRating() { return rating; }
        public void setRating(Integer rating) { this.rating = rating; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getComment() { return comment; }
        public void setComment(String comment) { this.comment = comment; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
