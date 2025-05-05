import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Eye, EyeOff, Copy, RefreshCcw, FileText, 
  BarChart2, History, Terminal, Code
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Types
interface ApiHistoryEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  status: number;
  responseTime: number;
}

interface ApiStats {
  totalRequests: number;
  totalErrors: number;
  lastUsed: string | null;
}

// API Key Management Component
interface ApiKeyManagementProps {
  apiKey: string | null;
  hasKey: boolean;
  loading: boolean;
  showKey: boolean;
  onToggleShow: () => void;
  onGenerate: () => void;
  onRevoke: () => void;
  onCopy: () => void;
}

function ApiKeyManagement({
  apiKey,
  hasKey,
  loading,
  showKey,
  onToggleShow,
  onGenerate,
  onRevoke,
  onCopy
}: ApiKeyManagementProps) {
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  
  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" /> API Key
        </span>
      </div>
      
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : hasKey ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type={showKey ? "text" : "password"}
              value={apiKey || ""}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleShow}
              title={showKey ? "Hide" : "Show"}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCopy}
              title="Copy"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600"
                  title="Revoke API Key"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Revoke API Key</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to revoke this API key? Any applications using this key will stop working immediately.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRevokeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      onRevoke();
                      setRevokeDialogOpen(false);
                    }}
                  >
                    Revoke Key
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-xs text-muted-foreground">
            Keep your API key secret. You can revoke and generate a new key at any time.
          </p>
          
          {/* Quick Start Section */}
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-medium mb-2">Quick Start</h3>
            <div className="bg-muted rounded p-3 text-xs overflow-x-auto">
              <p className="mb-2 text-muted-foreground">Add your API key to request headers:</p>
              <pre className="font-mono">
{`fetch('https://api.vorex.dev/seller-api/orders', {
  headers: {
    'x-api-key': '${showKey ? apiKey : "YOUR_API_KEY"}'
  }
})`}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm">You don't have an API key yet.</p>
          <Button onClick={onGenerate} disabled={loading}>
            Generate API Key
          </Button>
        </div>
      )}
    </Card>
  );
}

// API Usage Stats Component
interface ApiStatsProps {
  stats: ApiStats | null;
  loading: boolean;
}

function ApiUsageStats({ stats, loading }: ApiStatsProps) {
  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 className="h-4 w-4 text-primary" />
        <span className="font-medium">API Usage Stats</span>
      </div>
      
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Requests</span>
            <div className="font-semibold">{stats.totalRequests}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Total Errors</span>
            <div className="font-semibold">{stats.totalErrors}</div>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Last Used</span>
            <div className="font-semibold">
              {stats.lastUsed ? new Date(stats.lastUsed).toLocaleString() : "Never"}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground text-sm text-center py-6">
          <BarChart2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No usage data available yet.</p>
        </div>
      )}
    </Card>
  );
}

// API History Component
interface ApiHistoryProps {
  history: ApiHistoryEntry[];
  loading: boolean;
}

function ApiHistory({ history, loading }: ApiHistoryProps) {
  function getStatusColor(status: number): string {
    if (status < 300) return "text-green-500";
    if (status < 400) return "text-blue-500";
    if (status < 500) return "text-yellow-500";
    return "text-red-500";
  }

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-primary" />
        <span className="font-medium">API Call History</span>
      </div>
      
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-muted-foreground text-sm text-center py-6">
          <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No API calls yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Time</th>
                <th className="text-left py-2 font-medium">Endpoint</th>
                <th className="text-left py-2 font-medium">Status</th>
                <th className="text-left py-2 font-medium">Response (ms)</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 font-mono">{entry.endpoint}</td>
                  <td className={`py-2 pr-4 ${getStatusColor(entry.status)}`}>
                    {entry.status}
                  </td>
                  <td className="py-2 pr-4">{entry.responseTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// API Documentation Component
function ApiDocumentation() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-4 w-4 text-primary" />
        <span className="font-medium">API Documentation</span>
      </div>
      
      <div className="space-y-6">
        {/* Authentication Section */}
        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Code className="h-4 w-4 text-primary" /> Authentication
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            Include your API key in all requests using the <code className="px-1 py-0.5 bg-muted rounded">x-api-key</code> header.
          </p>
        </div>
        
        {/* Endpoints Section */}
        <div>
          <h3 className="text-sm font-medium mb-2">Endpoints</h3>
          <div className="space-y-3 text-xs">
            <div className="border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-1.5 py-0.5 rounded text-[10px] font-medium">POST</span>
                <code className="font-mono">/seller-api/orders</code>
              </div>
              <p className="mt-1 text-muted-foreground">Create a new order for delivery</p>
            </div>
            
            <div className="border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-1.5 py-0.5 rounded text-[10px] font-medium">GET</span>
                <code className="font-mono">/seller-api/orders</code>
              </div>
              <p className="mt-1 text-muted-foreground">List all your orders</p>
            </div>
            
            <div className="border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-1.5 py-0.5 rounded text-[10px] font-medium">GET</span>
                <code className="font-mono">/seller-api/orders/:id</code>
              </div>
              <p className="mt-1 text-muted-foreground">Get details for a specific order</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-1.5 py-0.5 rounded text-[10px] font-medium">GET</span>
                <code className="font-mono">/seller-api/orders/:id/status</code>
              </div>
              <p className="mt-1 text-muted-foreground">Get current status of an order</p>
            </div>
          </div>
        </div>
        
        {/* Example Request */}
        <div>
          <h3 className="text-sm font-medium mb-2">Example Request</h3>
          <pre className="bg-muted rounded p-2 text-xs overflow-x-auto font-mono">
{`curl -X POST https://api.vorex.dev/seller-api/orders \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "address": "123 Main St",
    "city": "Tunis",
    "governorate": "Tunis",
    "postalCode": "1000",
    "phone": "+21612345678",
    "items": [
      {
        "productId": "prod_123",
        "quantity": 2,
        "price": 50
      }
    ],
    "totalAmount": 100
  }'`}
          </pre>
        </div>
      </div>
      
      <div className="mt-6 pt-3 border-t">
        <a
          href="https://vorex.dev/docs/seller-api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline flex items-center gap-1 text-sm"
        >
          <FileText className="h-4 w-4" />
          Full API Documentation
        </a>
      </div>
    </Card>
  );
}

// Main Component
export function SellerApiPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [history, setHistory] = useState<ApiHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKey();
    fetchApiHistory();
  }, []);

  async function fetchApiKey() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seller-api/me", { credentials: "include" });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch API key: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.apiKey) {
        setApiKey(data.apiKey);
        setHasKey(true);
      } else {
        setApiKey(null);
        setHasKey(false);
      }
      if (data.stats) setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch API key");
      console.error("Error fetching API key:", err);
      setApiKey(null);
      setHasKey(false);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchApiHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/seller-api/history", { credentials: "include" });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch API history: ${res.status}`);
      }
      
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching API history:", err);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seller-api/generate-key", {
        method: "POST",
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error(`Failed to generate API key: ${res.status}`);
      }
      
      const data = await res.json();
      if (data.apiKey) {
        setApiKey(data.apiKey);
        setHasKey(true);
        setShowKey(true);
        toast.success("API key generated!");
      } else {
        toast.error("Failed to generate API key");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate API key");
      console.error("Error generating API key:", err);
      toast.error("Failed to generate API key");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seller-api/revoke-key", {
        method: "POST",
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error(`Failed to revoke API key: ${res.status}`);
      }
      
      setApiKey(null);
      setHasKey(false);
      setShowKey(false);
      toast.success("API key revoked");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key");
      console.error("Error revoking API key:", err);
      toast.error("Failed to revoke API key");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast.success("API key copied to clipboard");
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">API Integration</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <ApiKeyManagement
            apiKey={apiKey}
            hasKey={hasKey}
            loading={loading}
            showKey={showKey}
            onToggleShow={() => setShowKey(!showKey)}
            onGenerate={handleGenerate}
            onRevoke={handleRevoke}
            onCopy={handleCopy}
          />
          <ApiDocumentation />
        </div>
        
        <div className="space-y-6">
          <ApiUsageStats stats={stats} loading={loading} />
          <ApiHistory history={history} loading={historyLoading} />
        </div>
      </div>
    </div>
  );
} 