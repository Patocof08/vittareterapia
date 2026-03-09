import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Mail, PlusCircle, Edit } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MarketingDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    published: 0,
    drafts: 0,
    subscribers: 0,
  });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { count: published } = await supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "published");

      const { count: drafts } = await supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft");

      const { count: subscribers } = await supabase
        .from("newsletter_subscribers")
        .select("*", { count: "exact", head: true })
        .eq("subscribed", true);

      setStats({
        published: published || 0,
        drafts: drafts || 0,
        subscribers: subscribers || 0,
      });

      const { data: recent } = await supabase
        .from("blog_posts")
        .select("id, title, status, created_at, published_at, blog_categories(label)")
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentPosts(recent || []);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Marketing</h1>
          <p className="text-muted-foreground mt-1">Gestiona el blog y el contenido de Vittare</p>
        </div>
        <Button onClick={() => navigate("/marketing/posts/new")}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Nuevo Post
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/marketing/posts")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Publicados</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? "—" : stats.published}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/marketing/posts")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Borradores</CardTitle>
            <Edit className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? "—" : stats.drafts}</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/marketing/subscribers")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Suscriptores</CardTitle>
            <Mail className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{loading ? "—" : stats.subscribers}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Posts Recientes</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate("/marketing/posts")}>
              Ver todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentPosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay posts aún</p>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/marketing/posts/${post.id}/edit`)}
                >
                  <div>
                    <p className="font-medium text-sm">{post.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{post.blog_categories?.label}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(post.created_at), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    post.status === "published"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {post.status === "published" ? "Publicado" : "Borrador"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingDashboard;
