import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Upload, Loader2, Cpu, Plus, Trash2, GripVertical } from "lucide-react";
import { motion, Reorder } from "motion/react";
import { heroService, type HeroContent } from "@/api/heroService";
import { uploadService } from "@/api/uploadService";

const defaultHero: HeroContent = {
  title: "Precision Tools for Modern Workflow",
  subtitle: "Powering performance, built for every ambition. Explore our curated collection of premium electronics.",
  image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop",
  link: "/shop",
  specs: [
    { label: "Processor", value: "Intel® Core™ i5" },
    { label: "RAM", value: "8 GB DDR5" },
    { label: "Storage", value: "512 GB SSD" }
  ]
};

const HeroSettings = () => {
  const [content, setContent] = useState<HeroContent>(defaultHero);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const data = await heroService.getSettings();
        if (data) {
          setContent(data);
        }
      } catch (error) {
        console.error("Failed to load hero settings:", error);
        toast.error("Failed to load hero settings");
      } finally {
        setLoading(false);
      }
    };
    fetchHero();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await heroService.updateSettings(content);
      toast.success("Hero settings updated successfully");
    } catch (error) {
      console.error("Failed to update hero settings:", error);
      toast.error("Failed to update hero settings");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadService.uploadImage(file, 'hero');
      setContent(prev => ({ ...prev, image: url }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const addSpec = () => {
    setContent(prev => ({
      ...prev,
      specs: [...prev.specs, { label: "New Feature", value: "Value" }]
    }));
  };

  const removeSpec = (index: number) => {
    setContent(prev => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== index)
    }));
  };

  const updateSpec = (index: number, field: keyof HeroSpec, value: string) => {
    setContent(prev => ({
      ...prev,
      specs: prev.specs.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Hero Banner Settings</h1>
          <p className="text-sm text-muted-foreground">Customize the main banner on your home page</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary px-6 py-2.5 flex items-center gap-2 shadow-lg shadow-primary/20 w-full sm:w-auto"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Text Content */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full" />
              Text Content
            </h2>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Main Title</label>
              <input
                type="text"
                value={content.title}
                onChange={e => setContent(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-display text-lg font-bold"
                placeholder="Enter main title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subtitle</label>
              <textarea
                value={content.subtitle}
                onChange={e => setContent(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[120px] resize-none text-sm leading-relaxed"
                placeholder="Enter subtitle"
              />
            </div>
          </div>

          {/* Link URL */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full" />
              Call to Action
            </h2>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Link URL</label>
              <input
                type="text"
                value={content.link || ""}
                onChange={e => setContent(prev => ({ ...prev, link: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                placeholder="/shop"
              />
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                Featured Specifications
              </h2>
              <button
                onClick={addSpec}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <Plus size={14} />
                Add Feature
              </button>
            </div>

            <Reorder.Group axis="y" values={content.specs || []} onReorder={(newSpecs) => setContent(prev => ({ ...prev, specs: newSpecs }))} className="space-y-3">
              {(content.specs || []).map((spec, index) => (
                <Reorder.Item
                  key={`${spec.label}-${index}`}
                  value={spec}
                  className="flex items-center gap-3 p-4 bg-muted rounded-xl border border-border group"
                >
                  <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground">
                    <GripVertical size={18} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    <input
                      type="text"
                      value={spec.label}
                      onChange={e => updateSpec(index, 'label', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-border text-xs font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Label (e.g. RAM)"
                    />
                    <input
                      type="text"
                      value={spec.value}
                      onChange={e => updateSpec(index, 'value', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-border text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Value (e.g. 16 GB)"
                    />
                  </div>
                  <button
                    onClick={() => removeSpec(index)}
                    className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            
            {(!content.specs || content.specs.length === 0) && (
              <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
                <p className="text-sm text-muted-foreground">No features added yet. Click "Add Feature" to start.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Image Upload */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full" />
              Hero Image
            </h2>
            
            <div className="relative aspect-square rounded-xl overflow-hidden bg-muted border-2 border-dashed border-border group">
              {content.image ? (
                <img src={content.image} alt="Hero preview" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Upload size={32} strokeWidth={1} />
                  <span className="text-xs mt-2">No image selected</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer bg-card text-foreground px-4 py-2 rounded-full text-xs font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-2">
                  <Upload size={14} />
                  {uploading ? "Uploading..." : "Change Image"}
                  <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" disabled={uploading} />
                </label>
              </div>
              
              {uploading && (
                <div className="absolute inset-0 bg-card/80 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">Recommended: 800x600px or larger with transparent background</p>
          </div>

          {/* Preview Card */}
          <div className="bg-gray-900 p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4">
            <h2 className="text-white text-sm font-bold uppercase tracking-widest opacity-50">Live Preview</h2>
            <div className="space-y-3">
              <h3 className="text-white font-display font-bold text-lg leading-tight">{content.title}</h3>
              <p className="text-white/60 text-xs line-clamp-2">{content.description}</p>
              <div className="flex flex-wrap gap-2">
                {content.specs.slice(0, 3).map((spec, i) => (
                  <div key={i} className="px-2 py-1 bg-card/10 rounded text-[8px] text-white/80 font-mono">
                    {spec.value}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSettings;
