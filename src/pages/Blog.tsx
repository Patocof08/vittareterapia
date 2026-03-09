import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Search, ArrowRight } from "lucide-react";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("categoria") || "all";
  const searchQuery = searchParams.get("q") || "";

  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchQuery);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadPosts();
  }, [activeCategory, searchQuery]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("blog_categories")
      .select("*")
      .order("sort_order");
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
        if (cat) {
          query = query.eq("category_id", cat.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (p: any) =>
            p.title.toLowerCase().includes(q) ||
            (p.excerpt && p.excerpt.toLowerCase().includes(q))
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
    if (categoryName === "all") {
      params.delete("categoria");
    } else {
      params.set("categoria", categoryName);
    }
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (search.trim()) {
      params.set("q", search.trim());
    } else {
      params.delete("q");
    }
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-muted/30 py-16 border-b border-border">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Artículos, guías y recursos sobre bienestar mental escritos para acompañarte en tu proceso.
          </p>
        </div>
      </section>

      {/* Filtros + Búsqueda */}
      <section className="border-b border-border sticky top-16 bg-background/95 backdrop-blur-sm z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto">
              <Button
                variant={activeCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryFilter("all")}
                className="whitespace-nowrap"
              >
                Todos
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryFilter(cat.name)}
                  className="whitespace-nowrap"
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar artículos..."
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="outline" size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Posts grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-20 text-muted-foreground">Cargando artículos...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg text-muted-foreground mb-2">
                {searchQuery
                  ? `No se encontraron artículos para "${searchQuery}"`
                  : "Pronto encontrarás artículos aquí."}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => { setSearch(""); setSearchParams({}); }}>
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Featured post (first one) */}
              <Link to={`/blog/${posts[0].slug}`} className="block mb-12 group">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  {posts[0].cover_image_url ? (
                    <img
                      src={posts[0].cover_image_url}
                      alt={posts[0].title}
                      className="w-full h-[300px] md:h-[400px] object-cover rounded-2xl group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-[300px] md:h-[400px] bg-muted rounded-2xl flex items-center justify-center">
                      <span className="text-4xl">📝</span>
                    </div>
                  )}
                  <div>
                    <Badge variant="secondary" className="mb-3">
                      {posts[0].blog_categories?.label}
                    </Badge>
                    <h2 className="text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {posts[0].title}
                    </h2>
                    {posts[0].excerpt && (
                      <p className="text-muted-foreground text-lg mb-4 line-clamp-3">
                        {posts[0].excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(posts[0].published_at), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Rest of posts as grid */}
              {posts.length > 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.slice(1).map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                      <div className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-large transition-shadow h-full flex flex-col">
                        {post.cover_image_url ? (
                          <img
                            src={post.cover_image_url}
                            alt={post.title}
                            className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity"
                          />
                        ) : (
                          <div className="w-full h-48 bg-muted flex items-center justify-center">
                            <span className="text-3xl">📝</span>
                          </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col">
                          <Badge variant="secondary" className="self-start mb-2 text-xs">
                            {post.blog_categories?.label}
                          </Badge>
                          <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          {post.excerpt && (
                            <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
                              {post.excerpt}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(post.published_at), "d MMM yyyy", { locale: es })}
                            </span>
                            <span className="text-sm text-primary font-medium flex items-center gap-1">
                              Leer más <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-muted/30 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-2">Mantente informado</h2>
            <p className="text-muted-foreground mb-6">
              Recibe artículos sobre bienestar mental, tips prácticos y novedades de Vittare.
            </p>
            <NewsletterSignup source="blog-listing" variant="inline" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
