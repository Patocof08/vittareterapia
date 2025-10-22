import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { mockBlogPosts } from "@/data/mockData";

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-muted/30 py-16 border-b border-border">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog y recursos</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Artículos, consejos y recursos sobre salud mental escritos por nuestros terapeutas profesionales
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Link
              to={`/blog/${mockBlogPosts[0].id}`}
              className="group block bg-card rounded-2xl shadow-large overflow-hidden border border-border hover:shadow-xl transition-all"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                <div className="aspect-video md:aspect-auto">
                  <img
                    src={mockBlogPosts[0].image}
                    alt={mockBlogPosts[0].title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <Badge variant="secondary" className="w-fit mb-4">
                    Destacado
                  </Badge>
                  <h2 className="text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                    {mockBlogPosts[0].title}
                  </h2>
                  <p className="text-muted-foreground mb-6">{mockBlogPosts[0].excerpt}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{mockBlogPosts[0].author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{mockBlogPosts[0].date}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-primary font-medium group-hover:gap-2 transition-all">
                    Leer artículo
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* All Posts */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Todos los artículos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {mockBlogPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="group bg-card rounded-xl shadow-soft overflow-hidden border border-border hover:shadow-medium transition-all"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <User className="w-3 h-3" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{post.date}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
