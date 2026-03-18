import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Calendar, Search, ArrowRight } from "lucide-react";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("categoria") || "all";
  const searchQuery = searchParams.get("q") || "";

  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchQuery);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadPosts(); }, [activeCategory, searchQuery]);

  const loadCategories = async () => {
    const { data } = await supabase.from("blog_categories").select("*").order("sort_order");
    setCategories(data || []);
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("blog_posts")
        .select("id, title, slug, excerpt, cover_image_url, published_at, category_id, blog_categories(label, name)")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (activeCategory !== "all") {
        const cat = categories.find((c) => c.name === activeCategory);
        if (cat) query = query.eq("category_id", cat.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((p: any) =>
          p.title.toLowerCase().includes(q) || (p.excerpt && p.excerpt.toLowerCase().includes(q))
        );
      }
      setPosts(filtered);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryFilter = (categoryName: string) => {
    const params = new URLSearchParams(searchParams);
    if (categoryName === "all") params.delete("categoria");
    else params.set("categoria", categoryName);
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search.trim()) params.set("q", search.trim());
    else params.delete("q");
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FAFAF8" }}>
      <Navbar />

      {/* Hero */}
      <section
        className="relative py-20 md:py-28 overflow-hidden"
        style={{ background: "linear-gradient(180deg, #F0FAF8 0%, #E8F7F3 60%, #FAFAF8 100%)" }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] opacity-25"
            style={{ background: "radial-gradient(circle, #BFE9E2 0%, transparent 65%)" }} />
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-karla uppercase tracking-wide mb-5"
              style={{ background: "#BFE9E2", color: "#12A357" }}
            >
              Blog
            </div>
            <h1 className="font-erstoria text-[clamp(2rem,5vw,3.5rem)] text-[#1F4D2E] leading-[1.1] tracking-[-0.025em] mb-4">
              Recursos para tu bienestar
            </h1>
            <p className="font-karla text-lg text-[#6D8F7A] max-w-xl leading-relaxed">
              Artículos, guías y recursos sobre salud mental escritos para acompañarte en tu proceso.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filtros + Búsqueda */}
      <section
        className="border-b sticky top-16 z-30 py-4"
        style={{ background: "rgba(250,250,248,0.95)", borderColor: "#BFE9E2", backdropFilter: "blur(8px)" }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
              {[{ id: "all", label: "Todos" }, ...categories.map((c) => ({ id: c.name, label: c.label }))].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryFilter(cat.id)}
                  className="whitespace-nowrap px-4 py-2 rounded-xl font-karla text-sm font-medium transition-all cursor-pointer"
                  style={
                    activeCategory === cat.id
                      ? { background: "#12A357", color: "white" }
                      : { background: "#BFE9E230", color: "#3A6A4C", border: "1px solid #BFE9E2" }
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6D8F7A]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar artículos..."
                  className="pl-9 border-[#BFE9E2] font-karla rounded-xl"
                />
              </div>
              <button
                type="submit"
                className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer"
                style={{ background: "#BFE9E2", color: "#12A357" }}
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Posts grid */}
      <section className="py-12 flex-1">
        <div className="container mx-auto px-4 md:px-6">
          {loading ? (
            <div className="text-center py-20 font-karla text-[#6D8F7A]">Cargando artículos...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-karla text-lg text-[#6D8F7A] mb-4">
                {searchQuery ? `No se encontraron artículos para "${searchQuery}"` : "Pronto encontrarás artículos aquí."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => { setSearch(""); setSearchParams({}); }}
                  className="font-karla text-sm px-5 py-2 rounded-xl border cursor-pointer"
                  style={{ borderColor: "#BFE9E2", color: "#3A6A4C" }}
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Featured post */}
              <Link to={`/blog/${posts[0].slug}`} className="block mb-12 group">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white rounded-3xl p-6 md:p-8 border"
                  style={{ borderColor: "#BFE9E2", boxShadow: "0 4px 32px rgba(18,163,87,0.07)" }}
                >
                  {posts[0].cover_image_url ? (
                    <img
                      src={posts[0].cover_image_url}
                      alt={posts[0].title}
                      className="w-full h-[260px] md:h-[320px] object-cover rounded-2xl group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-[260px] rounded-2xl flex items-center justify-center text-5xl"
                      style={{ background: "#D4F0E2" }}>
                      📝
                    </div>
                  )}
                  <div>
                    {posts[0].blog_categories?.label && (
                      <span
                        className="inline-block font-karla text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-3"
                        style={{ background: "#D4F0E2", color: "#12A357" }}
                      >
                        {posts[0].blog_categories.label}
                      </span>
                    )}
                    <h2 className="font-erstoria text-2xl md:text-3xl text-[#1F4D2E] leading-[1.2] mb-3 group-hover:text-[#12A357] transition-colors">
                      {posts[0].title}
                    </h2>
                    {posts[0].excerpt && (
                      <p className="font-karla text-[#6D8F7A] text-base mb-4 line-clamp-3 leading-relaxed">
                        {posts[0].excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-[#6D8F7A]">
                      <Calendar className="w-4 h-4" />
                      <span className="font-karla">
                        {format(new Date(posts[0].published_at), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>

              {/* Grid rest */}
              {posts.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.slice(1).map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.06 }}
                    >
                      <Link to={`/blog/${post.slug}`} className="group block h-full">
                        <div
                          className="bg-white rounded-3xl border overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col"
                          style={{ borderColor: "#BFE9E2", boxShadow: "0 2px 12px rgba(18,163,87,0.06)" }}
                        >
                          {post.cover_image_url ? (
                            <img
                              src={post.cover_image_url}
                              alt={post.title}
                              className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                            />
                          ) : (
                            <div className="w-full h-48 flex items-center justify-center text-4xl" style={{ background: "#D4F0E2" }}>📝</div>
                          )}
                          <div className="p-5 flex-1 flex flex-col">
                            {post.blog_categories?.label && (
                              <span
                                className="inline-block self-start font-karla text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3"
                                style={{ background: "#D4F0E2", color: "#12A357" }}
                              >
                                {post.blog_categories.label}
                              </span>
                            )}
                            <h3 className="font-karla font-bold text-base text-[#1F4D2E] mb-2 group-hover:text-[#12A357] transition-colors line-clamp-2 flex-1">
                              {post.title}
                            </h3>
                            {post.excerpt && (
                              <p className="font-karla text-xs text-[#6D8F7A] mb-4 line-clamp-2 leading-relaxed">
                                {post.excerpt}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#BFE9E2]">
                              <span className="font-karla text-xs text-[#6D8F7A]">
                                {format(new Date(post.published_at), "d MMM yyyy", { locale: es })}
                              </span>
                              <span className="font-karla text-xs font-semibold flex items-center gap-1" style={{ color: "#12A357" }}>
                                Leer más <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16" style={{ background: "#F0FAF8", borderTop: "1px solid #BFE9E2" }}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="font-erstoria text-2xl text-[#1F4D2E] mb-2">Mantente informado</h2>
            <p className="font-karla text-[#6D8F7A] mb-6 leading-relaxed">
              Recibe artículos sobre bienestar mental, tips prácticos y novedades de Vittare.
            </p>
            <NewsletterSignup source="blog-listing" variant="inline" />
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default Blog;
