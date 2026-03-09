import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "Borrador", variant: "secondary" },
  published: { label: "Publicado", variant: "default" },
  archived: { label: "Archivado", variant: "outline" },
};

const MarketingPosts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(label)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Posts del Blog</h1>
          <p className="text-muted-foreground mt-1">Gestiona todos los artículos</p>
        </div>
        <Button onClick={() => navigate("/marketing/posts/new")}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Nuevo Post
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : posts.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Aún no hay posts</p>
          <Button onClick={() => navigate("/marketing/posts/new")}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Crear el primero
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex items-start gap-4">
                {post.cover_image_url && (
                  <img
                    src={post.cover_image_url}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{post.title}</h3>
                    <Badge variant={statusLabels[post.status]?.variant || "secondary"}>
                      {statusLabels[post.status]?.label || post.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{post.excerpt || "Sin descripción"}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{post.blog_categories?.label}</span>
                    <span>·</span>
                    <span>{format(new Date(post.created_at), "d MMM yyyy", { locale: es })}</span>
                    {post.published_at && (
                      <>
                        <span>·</span>
                        <span>Publicado: {format(new Date(post.published_at), "d MMM yyyy", { locale: es })}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {post.status === "published" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                      title="Ver publicación"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(`/marketing/posts/${post.id}/edit`)}
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketingPosts;
