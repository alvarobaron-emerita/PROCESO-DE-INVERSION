import { useState } from "react";
import { 
  Key, 
  Sparkles, 
  Target, 
  Save,
  Eye,
  EyeOff,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export function DiscoverySettings() {
  const { toast } = useToast();
  const [showTavilyKey, setShowTavilyKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  
  // API Keys state
  const [tavilyKey, setTavilyKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  
  // Thesis parameters
  const [minEbitda, setMinEbitda] = useState([15]);
  const [minGrossMargin, setMinGrossMargin] = useState([35]);
  const [maxLeaderShare, setMaxLeaderShare] = useState([25]);
  const [minCashConversion, setMinCashConversion] = useState([70]);
  
  // Prompt settings
  const [systemPrompt, setSystemPrompt] = useState(
    `Eres un analista de inversiones experto en due diligence y análisis sectorial. Tu objetivo es identificar oportunidades de inversión en sectores fragmentados con márgenes atractivos.

Criterios de la Tesis Emerita:
- EBITDA mínimo: 15%
- Fragmentación alta (líder < 25% cuota)
- Empresas familiares con facturación 5-50M€
- Preferencia por sectores con sucesión generacional pendiente`
  );
  
  const [autoAnalysis, setAutoAnalysis] = useState(true);

  const handleSaveApiKeys = () => {
    toast({
      title: "Claves guardadas",
      description: "Las API keys se han guardado correctamente.",
    });
  };

  const handleSaveThesis = () => {
    toast({
      title: "Tesis actualizada",
      description: "Los parámetros de la tesis se han guardado.",
    });
  };

  const handleSavePrompts = () => {
    toast({
      title: "Prompts guardados",
      description: "La configuración de prompts se ha actualizado.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Ajustes de Discovery Engine
        </h2>
        <p className="text-muted-foreground">
          Configura las API keys, parámetros de la tesis de inversión y prompts de IA.
        </p>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="thesis" className="gap-2">
            <Target className="h-4 w-4" />
            Tesis de Inversión
          </TabsTrigger>
          <TabsTrigger value="prompts" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Prompts IA
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tavily Search API</CardTitle>
              <CardDescription>
                Clave para búsquedas web en tiempo real durante el análisis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tavily-key">API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="tavily-key"
                      type={showTavilyKey ? "text" : "password"}
                      placeholder="tvly-xxxxxxxxxxxxx"
                      value={tavilyKey}
                      onChange={(e) => setTavilyKey(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowTavilyKey(!showTavilyKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showTavilyKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtén tu clave en{" "}
                  <a href="https://tavily.com" target="_blank" rel="noopener" className="text-primary hover:underline">
                    tavily.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Google Gemini API</CardTitle>
              <CardDescription>
                Clave para el análisis con IA y generación de informes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-key">API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="gemini-key"
                      type={showGeminiKey ? "text" : "password"}
                      placeholder="AIzaxxxxxxxxxxxxxxxx"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtén tu clave en{" "}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-primary hover:underline">
                    Google AI Studio
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveApiKeys} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Guardar API Keys
          </Button>
        </TabsContent>

        {/* Thesis Parameters Tab */}
        <TabsContent value="thesis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Parámetros de la Tesis Emerita
                <Badge variant="secondary">Auto-penalización activa</Badge>
              </CardTitle>
              <CardDescription>
                Define los umbrales mínimos para filtrar sectores atractivos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* EBITDA Margin */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Margen EBITDA Mínimo</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Sectores por debajo serán marcados con alerta
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {minEbitda[0]}%
                  </Badge>
                </div>
                <Slider
                  value={minEbitda}
                  onValueChange={setMinEbitda}
                  min={5}
                  max={30}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Gross Margin */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Margen Bruto Mínimo</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Indicador de estructura de costes saludable
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {minGrossMargin[0]}%
                  </Badge>
                </div>
                <Slider
                  value={minGrossMargin}
                  onValueChange={setMinGrossMargin}
                  min={15}
                  max={60}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Leader Share */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cuota Máxima del Líder</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fragmentación favorable para consolidación
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {maxLeaderShare[0]}%
                  </Badge>
                </div>
                <Slider
                  value={maxLeaderShare}
                  onValueChange={setMaxLeaderShare}
                  min={10}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Cash Conversion */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Conversión de Caja Mínima</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Calidad del flujo de caja operativo
                    </p>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {minCashConversion[0]}%
                  </Badge>
                </div>
                <Slider
                  value={minCashConversion}
                  onValueChange={setMinCashConversion}
                  min={40}
                  max={95}
                  step={5}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveThesis} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Guardar Parámetros
          </Button>
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prompt del Sistema</CardTitle>
              <CardDescription>
                Instrucciones base para el agente de análisis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Este prompt se enviará al inicio de cada análisis. Las variables como{" "}
                  <code className="bg-muted px-1 rounded">{"{sector}"}</code> y{" "}
                  <code className="bg-muted px-1 rounded">{"{contexto}"}</code>{" "}
                  se reemplazarán automáticamente.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Opciones de Análisis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Análisis automático de CNAE</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Identificar códigos CNAE relacionados automáticamente
                  </p>
                </div>
                <Switch
                  checked={autoAnalysis}
                  onCheckedChange={setAutoAnalysis}
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSavePrompts} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            Guardar Configuración
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
