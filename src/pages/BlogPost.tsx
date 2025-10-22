import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowLeft, Clock } from "lucide-react";
import { mockBlogPosts } from "@/data/mockData";

const BlogPost = () => {
  const { id } = useParams();
  const post = mockBlogPosts.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold mb-4">Artículo no encontrado</h1>
          <Link to="/blog" className="text-primary hover:underline">
            Volver al blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const content = `
    <p>La práctica del mindfulness se ha convertido en una herramienta fundamental para manejar el estrés en nuestra vida cotidiana. En este artículo, exploraremos cinco técnicas prácticas que puedes comenzar a usar hoy mismo.</p>

    <h2>1. Respiración consciente</h2>
    <p>La técnica más básica pero poderosa del mindfulness es la respiración consciente. Dedica 5 minutos al día a simplemente observar tu respiración sin intentar cambiarla. Nota cómo el aire entra y sale de tu cuerpo.</p>

    <h2>2. Escaneo corporal</h2>
    <p>Esta técnica consiste en prestar atención sistemática a cada parte de tu cuerpo, desde los pies hasta la cabeza. Te ayuda a reconectar con las sensaciones físicas y liberar tensiones acumuladas.</p>

    <h2>3. Mindfulness en actividades cotidianas</h2>
    <p>Puedes practicar mindfulness mientras comes, caminas o incluso lavas los platos. La clave es prestar atención plena a la experiencia del momento presente, usando todos tus sentidos.</p>

    <h2>4. Meditación de observación de pensamientos</h2>
    <p>En lugar de involucrarte con tus pensamientos, practica observarlos como si fueran nubes pasando por el cielo. Esta técnica te ayuda a crear distancia de pensamientos estresantes.</p>

    <h2>5. Gratitud diaria</h2>
    <p>Antes de dormir, reflexiona sobre tres cosas por las que estás agradecido ese día. Esta práctica simple pero poderosa puede transformar tu perspectiva y reducir significativamente el estrés.</p>

    <h2>Conclusión</h2>
    <p>El mindfulness no es una solución mágica, pero con práctica constante, estas técnicas pueden ayudarte a desarrollar una mayor resiliencia ante el estrés y mejorar tu bienestar general. Recuerda, la clave está en la consistencia, no en la perfección.</p>
  `;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Back button */}
      <div className="container mx-auto px-4 py-6">
        <Link
          to="/blog"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al blog
        </Link>
      </div>

      {/* Hero Image */}
      <div className="container mx-auto px-4 mb-12">
        <div className="max-w-4xl mx-auto">
          <div className="aspect-video rounded-2xl overflow-hidden shadow-large mb-8">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8 pb-8 border-b border-border">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>{post.date}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>5 min de lectura</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <article className="container mx-auto px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <div
            className="prose prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-foreground
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-foreground prose-strong:font-semibold
              prose-ul:my-6 prose-li:text-muted-foreground
            "
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Author Bio */}
          <div className="mt-16 p-8 bg-muted/30 rounded-xl border border-border">
            <div className="flex items-start space-x-4">
              <img
                src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop"
                alt={post.author}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">Sobre {post.author}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Psicóloga clínica especializada en terapia cognitivo-conductual y mindfulness. Con más de 12
                  años de experiencia ayudando a personas a mejorar su bienestar mental.
                </p>
                <Link to="/therapists" className="text-primary hover:underline text-sm font-medium">
                  Ver perfil completo →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Artículos relacionados</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {mockBlogPosts.filter((p) => p.id !== id).slice(0, 3).map((relatedPost) => (
              <Link
                key={relatedPost.id}
                to={`/blog/${relatedPost.id}`}
                className="group bg-card rounded-xl shadow-soft overflow-hidden border border-border hover:shadow-medium transition-all"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={relatedPost.image}
                    alt={relatedPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {relatedPost.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{relatedPost.excerpt}</p>
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

export default BlogPost;
