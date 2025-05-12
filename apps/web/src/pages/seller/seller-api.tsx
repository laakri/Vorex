import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Copy, RefreshCcw, FileText, BarChart2, History, Terminal } from "lucide-react";
import  api  from "@/lib/axios";

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

export function SellerApiPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [history, setHistory] = useState<ApiHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchApiKey();
    fetchApiHistory();
  }, []);

  async function fetchApiKey() {
    setLoading(true);
    try {
      const { data } = await api.get("/seller-api/me");
      if (data.apiKey) {
        setApiKey(data.apiKey);
        setHasKey(true);
      } else {
        setApiKey(null);
        setHasKey(false);
      }
      if (data.stats) setStats(data.stats);
    } catch (error) {
      setApiKey(null);
      setHasKey(false);
      setStats(null);
      toast.error("Failed to fetch API key");
    } finally {
      setLoading(false);
    }
  }

  async function fetchApiHistory() {
    setHistoryLoading(true);
    try {
      const { data } = await api.get("/seller-api/history");
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      setHistory([]);
      toast.error("Failed to fetch API history");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      const { data } = await api.post("/seller-api/generate-key");
      if (data.apiKey) {
        setApiKey(data.apiKey);
        setHasKey(true);
        setShowKey(true);
        toast.success("API key generated!");
      } else {
        toast.error("Failed to generate API key");
      }
    } catch (error) {
      toast.error("Failed to generate API key");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    setLoading(true);
    try {
      await api.post("/seller-api/revoke-key");
      setApiKey(null);
      setHasKey(false);
      setShowKey(false);
      toast.success("API key revoked");
    } catch (error) {
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
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Seller API Dashboard</h1>
      {/* API Key Management */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium flex items-center gap-2">
            <Terminal className="h-4 w-4 text-primary" /> API Key
          </span>
          {hasKey && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRevoke}
              disabled={loading}
              title="Revoke API Key"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
        {loading ? (
          <div className="text-muted-foreground text-sm">Loading...</div>
        ) : hasKey ? (
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
              onClick={() => setShowKey((v) => !v)}
              title={showKey ? "Hide" : "Show"}
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              title="Copy"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button onClick={handleGenerate} disabled={loading} className="mt-2">
            Generate API Key
          </Button>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Keep your API key secret. You can revoke and generate a new key at any time.
        </p>
      </Card>

      {/* API Usage Stats */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BarChart2 className="h-4 w-4 text-primary" />
          <span className="font-medium">API Usage Stats</span>
        </div>
        {stats ? (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Requests</span>
              <div className="font-semibold">{stats.totalRequests}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Errors</span>
              <div className="font-semibold">{stats.totalErrors}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Last Used</span>
              <div className="font-semibold">{stats.lastUsed ? new Date(stats.lastUsed).toLocaleString() : "Never"}</div>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">No usage data available.</div>
        )}
      </Card>

      {/* API Call History */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <History className="h-4 w-4 text-primary" />
          <span className="font-medium">API Call History</span>
        </div>
        {historyLoading ? (
          <div className="text-muted-foreground text-sm">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-muted-foreground text-sm">No API calls yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 pr-4">Time</th>
                  <th className="text-left py-1 pr-4">Endpoint</th>
                  <th className="text-left py-1 pr-4">Status</th>
                  <th className="text-left py-1 pr-4">Response Time (ms)</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0">
                    <td className="py-1 pr-4">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="py-1 pr-4 font-mono">{entry.endpoint}</td>
                    <td className="py-1 pr-4">{entry.status}</td>
                    <td className="py-1 pr-4">{entry.responseTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* API Documentation */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium">API Documentation</span>
        </div>
        <div className="mb-2 text-sm">
          <b>Quickstart:</b>
          <pre className="bg-muted rounded p-2 mt-1 text-xs overflow-x-auto">
{`# Example: Create an order
curl -X POST https://vorex.dev/api/seller-api/orders \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "address": "123 Main St",
    "city": "Tunis",
    "governorate": "Tunis",
    "postalCode": "1000",
    "phone": "+21612345678",
    "items": [
      { "productId": "prod_123", "quantity": 2, "price": 50 }
    ],
    "totalAmount": 100
  }'
`}
          </pre>
        </div>
        <div className="mb-2 text-sm">
          <b>Endpoints:</b>
          <ul className="list-disc ml-6">
            <li><code>POST /api/seller-api/orders</code> – Create a new order</li>
            <li><code>GET /api/seller-api/orders</code> – List your orders</li>
            <li><code>GET /api/seller-api/orders/:id</code> – Get order details</li>
            <li><code>GET /api/seller-api/orders/:id/status</code> – Get order status</li>
          </ul>
        </div>
        <a
          href="https://vorex.dev/docs/seller-api"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline text-sm"
        >
          Full API Documentation
        </a>
      </Card>
    </div>
  );
} 