import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, Upload } from "lucide-react";

const MarketingPostEditor = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category_id: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    meta_title: "",
    meta_description: "",
    status: "draft",
  });

  useEffect(() => {
    loadCategories();
    if (isEditing) loadPost();
  }, [id]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("blog_categories")
      .select("*")
      .order("sort_order");
    setCategories(data || []);
  };

  const loadPost = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      toast.error("Post no encontrado");
      navigate("/marketing/posts");
      return;
    }

    setFormData({
      title: data.title || "",
      slug: data.slug || "",
      category_id: data.category_id || "",
      excerpt: data.excerpt || "",
      content: data.content || "",
      cover_image_url: data.cover_image_url || "",
      meta_title: data.meta_title || "",
      meta_description: data.meta_description || "",
      status: data.status || "draft",
    });
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: !isEditing || !prev.slug ? generateSlug(title) : prev.slug,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `covers/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(path);

      setFormData((prev) => ({ ...prev, cover_image_url: urlData.publicUrl }));
      toast.success("Imagen subida");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (publishNow: boolean) => {
    if (!formData.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    if (!formData.category_id) {
      toast.error("Selecciona una categoría");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("El contenido es obligatorio");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      const status = publishNow ? "published" : "draft";
      const postData = {
        title: formData.title.trim(),
        slug: formData.slug || generateSlug(formData.title),
        category_id: formData.category_id,
        excerpt: formData.excerpt.trim() || null,
        content: formData.content,
        cover_image_url: formData.cover_image_url || null,
        meta_title: formData.meta_title.trim() || formData.title.trim(),
        meta_description: formData.meta_description.trim() || formData.excerpt.trim() || null,
        status,
        published_at: publishNow ? new Date().toISOString() : null,
        author_id: user.id,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", id);
        if (error) throw error;
        toast.success(publishNow ? "Post publicado" : "Borrador guardado");
      } else {
        const { error } = await supabase
          .from("blog_posts")
          .insert(postData);
        if (error) throw error;
        toast.success(publishNow ? "Post publicado" : "Borrador creado");
      }

      navigate("/marketing/posts");
    } catch (error: any) {
      console.error("Save error:", error);
      if (error.message?.includes("duplicate")) {
        toast.error("Ya existe un post con esa URL (slug)");
      } else {
        toast.error("Error al guardar");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/marketing/posts")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{isEditing ? "Editar Post" : "Nuevo Post"}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando..." : "Guardar borrador"}
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving}>
            <Send className="w-4 h-4 mr-2" />
            {saving ? "Publicando..." : "Publicar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Cómo elegir al psicólogo ideal para ti"
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="whitespace-nowrap">vittareterapia.com/blog/</span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="como-elegir-al-psicologo-ideal"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Resumen (se muestra en la card del blog)</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Un breve resumen del artículo..."
                  rows={2}
                  maxLength={250}
                />
                <p className="text-xs text-muted-foreground text-right">{formData.excerpt.length}/250</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenido (Markdown) *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder={"# Mi artículo\n\nEscribe aquí el contenido del post...\n\n## Subtítulo\n\nPuedes usar **negritas**, *cursivas*, listas:\n\n- Item 1\n- Item 2\n\nY más formato Markdown."}
                  rows={20}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Usa Markdown para dar formato: # Título, ## Subtítulo, **negrita**, *cursiva*, - listas
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, category_id: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Imagen de portada</Label>
                {formData.cover_image_url && (
                  <img
                    src={formData.cover_image_url}
                    alt="Portada"
                    className="w-full h-40 object-cover rounded-lg mb-2"
                  />
                )}
                <input
                  type="file"
                  id="cover-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById("cover-upload")?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? "Subiendo..." : formData.cover_image_url ? "Cambiar imagen" : "Subir imagen"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta título</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="Título para buscadores"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta descripción</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="Descripción para buscadores (máx 160 chars)"
                  rows={3}
                  maxLength={160}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketingPostEditor;
