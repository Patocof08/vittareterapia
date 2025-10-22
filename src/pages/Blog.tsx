import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const Blog = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-muted/30 py-16 border-b border-border">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Blog y recursos</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Artículos y recursos sobre salud mental escritos por nuestros terapeutas profesionales
          </p>
        </div>
      </section>

      {/* Empty State */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground mb-4">
              Pronto encontrarás artículos y recursos aquí.
            </p>
            <p className="text-muted-foreground">
              Estamos preparando contenido de calidad para ti.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;
