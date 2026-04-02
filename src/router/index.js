/**
 * @file router/index.js
 * @description Vue Router configuration for the application.
 *
 * Manages all application routes, lazy-loading for performance, and route guarding.
 *
 * Route Guards:
 *  The `beforeEach` navigation guard enforces four levels of access control:
 *   1. `requiresAuth`  — User must be logged in. Returns to `/login` if not.
 *   2. `requiresAdmin` — User must have the 'admin' or 'owner' role.
 *   3. `requiresOwner` — User must specifically be the 'owner' (super-admin).
 *   4. `guestOnly`     — User must be logged OUT (used for login/register pages).
 *
 * Performance:
 *  All routes use dynamic imports `() => import(...)`. This triggers Vite to
 *  code-split the build, meaning the user only downloads the JavaScript for
 *  a page when they actually visit it.
 */

import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";

// ── Lazy-loaded Page Components ──────────────────────────────────────────────
// Dynamically imported to reduce initial bundle size (Code Splitting)
const HomePage = () => import("@/pages/HomePage.vue");
const ProductListPage = () => import("@/pages/ProductListPage.vue");
const ProductDetailPage = () => import("@/pages/ProductDetailPage.vue");
const LoginPage = () => import("@/pages/LoginPage.vue");
const RegisterPage = () => import("@/pages/RegisterPage.vue");
const CartPage = () => import("@/pages/CartPage.vue");
const CheckoutPage = () => import("@/pages/CheckoutPage.vue");
const OrdersPage = () => import("@/pages/OrdersPage.vue");
const OrderTracker = () => import("@/pages/OrderTracker.vue");
const ProfilePage = () => import("@/pages/ProfilePage.vue");
const NotFoundPage = () => import("@/pages/NotFoundPage.vue");
const WishlistPage = () => import("@/pages/WishlistPage.vue");
const ContactPage = () => import("@/pages/ContactPage.vue");
const MaintenancePage = () => import("@/pages/MaintenancePage.vue");

// ── Lazy-loaded Admin Pages ──────────────────────────────────────────────────
const AdminLayout = () => import("@/layouts/AdminLayout.vue");
const AdminDashboard = () => import("@/pages/admin/DashboardPage.vue");
const AdminProducts = () => import("@/pages/admin/ProductsPage.vue");
const AdminCategories = () => import("@/pages/admin/CategoriesPage.vue");
const AdminOrders = () => import("@/pages/admin/OrdersPage.vue");
const AdminPayments = () => import("@/pages/admin/PaymentsPage.vue");
const AdminSettings = () => import("@/pages/admin/SettingsPage.vue");
const AdminUsers = () => import("@/pages/admin/UsersPage.vue");
const AdminReviews = () => import("@/pages/admin/ReviewsPage.vue");
const AdminMessages = () => import("@/pages/admin/MessagesPage.vue");
const AdminCoupons = () => import("@/pages/admin/CouponsPage.vue");
const AdminShipping = () => import("@/pages/admin/ShippingPage.vue");

// ── Route Definitions ─────────────────────────────────────────────────────────
const routes = [
  // ── Maintenance / Error Boundary ──
  {
    path: "/maintenance",
    name: "maintenance",
    component: MaintenancePage,
  },
  // ── Public routes ──
  {
    path: "/",
    name: "home",
    component: HomePage,
  },
  {
    path: "/products",
    name: "products",
    component: ProductListPage,
  },
  {
    path: "/products/:id",
    name: "product-detail",
    component: ProductDetailPage,
  },
  {
    path: "/contact",
    name: "contact",
    component: ContactPage,
  },
  {
    path: "/login",
    name: "login",
    component: LoginPage,
    meta: { guestOnly: true }, // Redirect existing logged-in users away from login
  },
  {
    path: "/register",
    name: "register",
    component: RegisterPage,
    meta: { guestOnly: true },
  },

  // ── User-protected routes ──
  {
    path: "/cart",
    name: "cart",
    component: CartPage,
    meta: { requiresAuth: true }, // Valid login required
  },
  {
    path: "/checkout",
    name: "checkout",
    component: CheckoutPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/orders",
    name: "orders",
    component: OrdersPage,
    meta: { requiresAuth: true },
  },
  {
    path: "/orders/:id/track",
    name: "order-tracker",
    component: OrderTracker,
    meta: { requiresAuth: true },
  },
  {
    path: "/profile",
    name: "profile",
    component: ProfilePage,
    meta: { requiresAuth: true },
  },
  {
    path: "/wishlist",
    name: "wishlist",
    component: WishlistPage,
  },

  // ── Admin routes ──
  {
    path: "/admin",
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: "",
        name: "admin-dashboard",
        component: AdminDashboard,
      },
      {
        path: "products",
        name: "admin-products",
        component: AdminProducts,
      },
      {
        path: "categories",
        name: "admin-categories",
        component: AdminCategories,
      },
      {
        path: "orders",
        name: "admin-orders",
        component: AdminOrders,
      },
      {
        path: "payments",
        name: "admin-payments",
        component: AdminPayments,
      },
      {
        path: "shipping",
        name: "admin-shipping",
        component: AdminShipping,
      },
      {
        path: "settings",
        name: "admin-settings",
        component: AdminSettings,
        meta: { requiresAuth: true, requiresOwner: true }, // Strictest guard (Owner only)
      },
      {
        path: "users",
        name: "admin-users",
        component: AdminUsers,
        meta: { requiresAuth: true, requiresOwner: true }, // Users management is Owner only
      },
      {
        path: "reviews",
        name: "admin-reviews",
        component: AdminReviews,
      },
      {
        path: "messages",
        name: "admin-messages",
        component: AdminMessages,
      },
      {
        path: "coupons",
        name: "admin-coupons",
        component: AdminCoupons,
      },
    ],
  },

  // ── Catch-all 404 ──
  {
    // Match any path not defined above and show the 404 page
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: NotFoundPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  // Automatically scroll to the top of the page when navigating to a new route
  scrollBehavior: () => ({ top: 0 }),
});

// ── Global Navigation Guards ──────────────────────────────────────────────────
/**
 * Executes before EVERY route change to enforce security rules based on the route's `meta` tags.
 */
router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();

  // 1. Guard: requiresAuth (User must be logged in)
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    // Pass the destination URL as a query param so we can redirect them back after they log in
    return next({ name: "login", query: { redirect: to.fullPath } });
  }

  // 2. Guard: requiresAdmin (User must be an 'admin' or 'owner')
  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return next({ name: "home" });
  }

  // 3. Guard: requiresOwner (Strictest — User must be the 'owner')
  if (to.meta.requiresOwner && !auth.isOwner) {
    // If they are an admin trying to access an owner page (e.g. Settings), kick them to admin dash.
    // Otherwise, kick them to the public home page.
    return next({ name: auth.isAdmin ? "admin-dashboard" : "home" });
  }

  // 4. Guard: guestOnly (User must NOT be logged in, e.g. Login or Register pages)
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return next({ name: "home" });
  }

  // All checks passed, allow navigation
  next();
});

export default router;
