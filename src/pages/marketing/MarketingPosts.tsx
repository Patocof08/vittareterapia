import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, Edit, Eye, FileText, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "Borrador", variant: "secondary" },
  published: { label: "Publicado", variant: "default" },
  archived: { label: "Archivado", variant: "outline" },
};

const MarketingPosts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith("/admin") ? "/admin/marketing" : "/marketing";
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(label), newsletter_sent_at, newsletter_recipients")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletePostId) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", deletePostId);
      if (error) throw error;
      toast.success("Post eliminado");
      setPosts((prev) => prev.filter((p) => p.id !== deletePostId));
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast.error("Error al eliminar el post");
    } finally {
      setDeleting(false);
      setDeletePostId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Posts del Blog</h1>
          <p className="text-muted-foreground mt-1">Gestiona todos los artículos</p>
        </div>
        <Button onClick={() => navigate(`${basePath}/posts/new`)}>
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
          <Button onClick={() => navigate(`${basePath}/posts/new`)}>
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
                    {post.newsletter_sent_at && (
                      <>
                        <span>·</span>
                        <span className="text-green-600">📧 Enviado a {post.newsletter_recipients || 0} suscriptores</span>
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
                    onClick={() => navigate(`${basePath}/posts/${post.id}/edit`)}
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletePostId(post.id)}
                    title="Eliminar"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este post?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El post se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MarketingPosts;
