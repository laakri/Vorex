import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Eye, EyeOff, Copy, RefreshCcw, FileText, 
  BarChart2, History, Terminal, Code, Check,
  Clipboard, AlertCircle, Clock, Hash 
} from "lucide-react";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

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
      console.error("Error fetching API key:", error);
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
      const { data } = await api.get("/seller-api/history");
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching API history:", error);
      setHistory([]);
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
      console.error("Error generating API key:", error);
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
      setRevokeDialogOpen(false);
    } catch (error) {
      console.error("Error revoking API key:", error);
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

  function getStatusColor(status: number) {
    if (status < 300) return "text-green-500";
    if (status < 400) return "text-blue-500";
    if (status < 500) return "text-yellow-500";
    return "text-red-500";
  }

  // Format date to local string
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">API Integration</h1>
        <div className="flex items-center gap-2">
          {loading && <p className="text-sm text-muted-foreground">Loading...</p>}
        </div>
      </div>

      <Tabs defaultValue="key" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="key" className="flex items-center gap-2">
            <Key className="h-4 w-4" /> API Key
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Documentation
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" /> Usage
          </TabsTrigger>
        </TabsList>

        {/* API Key Management Tab */}
        <TabsContent value="key">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">API Key Management</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your API key provides access to the Vorex API. Keep it secure and never share it in client-side code.
            </p>

            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : hasKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="flex-1 min-w-0">
                    <Input
                      type={showKey ? "text" : "password"}
                      value={apiKey || ""}
                      readOnly
                      className="font-mono text-sm bg-muted/30"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKey((v) => !v)}
                    title={showKey ? "Hide API Key" : "Show API Key"}
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                    title="Copy API Key"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Dialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        title="Revoke API Key"
                      >
                        <RefreshCcw className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Revoke API Key</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to revoke this API key? This action cannot be undone, and any applications using this key will stop working.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setRevokeDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleRevoke}
                          disabled={loading}
                        >
                          Revoke Key
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Never share your API key in public repositories or client-side code.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  You don't have an API key yet.
                </p>
                <Button onClick={handleGenerate} disabled={loading}>
                  Generate API Key
                </Button>
              </div>
            )}

            {hasKey && (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-md font-semibold mb-2">Quick Start Guide</h3>
                <div className="bg-muted rounded-md p-4 mb-4">
                  <h4 className="text-sm font-medium mb-2">Set up authentication</h4>
                  <p className="text-sm mb-2">Include your API key in the request headers:</p>
                  <pre className="bg-background rounded p-2 text-xs overflow-x-auto">
{`const response = await fetch('https://api.vorex.dev/seller-api/orders', {
  method: 'GET',
  headers: {
    'x-api-key': '${showKey ? apiKey : "YOUR_API_KEY"}'
  }
});`}
                  </pre>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Documentation Tab */}
        <TabsContent value="docs">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">API Documentation</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Learn how to use the Vorex Seller API to automate order creation and tracking.
            </p>

            <div className="space-y-8">
              {/* Authentication Section */}
              <div>
                <h3 className="text-md font-semibold mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4" /> Authentication
                </h3>
                <p className="text-sm mb-2">
                  All API requests require an API key passed in the <code className="bg-muted px-1 py-0.5 rounded text-xs">x-api-key</code> header.
                </p>
                <pre className="bg-muted rounded p-2 text-xs overflow-x-auto">
{`// Example request with authentication
fetch('https://api.vorex.dev/seller-api/orders', {
  headers: {
    'x-api-key': 'YOUR_API_KEY'
  }
})`}
                </pre>
              </div>

              {/* Endpoints Section */}
              <div>
                <h3 className="text-md font-semibold mb-2 flex items-center gap-2">
                  <Code className="h-4 w-4" /> Endpoints
                </h3>

                {/* Create Order */}
                <div className="mb-4 border-b pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs px-2 py-0.5 rounded">POST</span>
                    <code className="text-sm font-semibold">/seller-api/orders</code>
                  </div>
                  <p className="text-sm mb-2">Create a new order</p>
                  <Tabs defaultValue="request" className="w-full">
                    <TabsList className="mb-2">
                      <TabsTrigger value="request" className="text-xs">Request</TabsTrigger>
                      <TabsTrigger value="response" className="text-xs">Response</TabsTrigger>
                    </TabsList>
                    <TabsContent value="request">
                      <pre className="bg-muted rounded p-2 text-xs overflow-x-auto">
{`// Request body
{
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
      "price": 50,
      "weight": 1.5,
      "dimensions": "30x20x10",
      "packagingType": "box",
      "fragile": false,
      "perishable": false
    }
  ],
  "totalAmount": 100
}`}
                      </pre>
                    </TabsContent>
                    <TabsContent value="response">
                      <pre className="bg-muted rounded p-2 text-xs overflow-x-auto">
{`// Response (200 OK)
{
  "id": "order_123abc",
  "status": "PENDING",
  "totalAmount": 100,
  "deliveryPrice": 10,
  "customerName": "John Doe",
  "items": [
    {
      "id": "item_456",
      "productId": "prod_123",
      "quantity": 2,
      "price": 50
    }
  ],
  "createdAt": "2023-06-15T10:30:00Z"
}`}
                      </pre>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* List Orders */}
                <div className="mb-4 border-b pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 text-xs px-2 py-0.5 rounded">GET</span>
                    <code className="text-sm font-semibold">/seller-api/orders</code>
                  </div>
                  <p className="text-sm mb-2">List all your orders</p>
                  <pre className="bg-muted rounded p-2 text-xs overflow-x-auto">
{`// Response (200 OK)
[
  {
    "id": "order_123abc",
    "status": "PENDING",
    "totalAmount": 100,
    "customerName": "John Doe",
    "createdAt": "2023-06-15T10:30:00Z"
  },
  {
    "id": "order_456def",
    "status": "DELIVERED",
    "totalAmount": 75,
    "customerName": "Jane Smith",
    "createdAt": "2023-06-14T15:45:00Z"
  }
]`}
                  </pre>
                </div>

                {/* Get Order */}
                <div className="mb-4 border-b pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 text-xs px-2 py-0.5 rounded">GET</span>
                    <code className="text-sm font-semibold">/seller-api/orders/:id</code>
                  </div>
                  <p className="text-sm mb-2">Get a specific order by ID</p>
                  <pre className="bg-muted rounded p-2 text-xs overflow-x-auto">
{`// Response (200 OK)
{
  "id": "order_123abc",
  "status": "PENDING",
  "totalAmount": 100,
  "deliveryPrice": 10,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "address": "123 Main St",
  "city": "Tunis",
  "governorate": "Tunis",
  "postalCode": "1000",
  "phone": "+21612345678",
  "items": [
    {
      "id": "item_456",
      "productId": "prod_123",
      "quantity": 2,
      "price": 50,
      "productName": "Product Name"
    }
  ],
  "createdAt": "2023-06-15T10:30:00Z",
  "updatedAt": "2023-06-15T10:30:00Z"
}`}
                  </pre>
                </div>

                {/* Get Order Status */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 text-xs px-2 py-0.5 rounded">GET</span>
                    <code className="text-sm font-semibold">/seller-api/orders/:id/status</code>
                  </div>
                  <p className="text-sm mb-2">Get just the status of a specific order</p>
                  <pre className="bg-muted rounded p-2 text-xs overflow-x-auto">
{`// Response (200 OK)
{
  "status": "PENDING"
}`}
                  </pre>
                </div>
              </div>

              {/* Error Handling */}
              <div>
                <h3 className="text-md font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Error Handling
                </h3>
                <p className="text-sm mb-2">The API uses standard HTTP status codes to indicate success or failure:</p>
                <ul className="list-disc list-inside text-sm space-y-1 mb-2">
                  <li>2xx: Success</li>
                  <li>4xx: Client errors (invalid request, authentication, etc.)</li>
                  <li>5xx: Server errors</li>
                </ul>
                <pre className="bg-muted rounded p-2 text-xs overflow-x-auto">
{`// Example error response (400 Bad Request)
{
  "statusCode": 400,
  "message": "Invalid order data",
  "error": "Bad Request"
}`}
                </pre>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <a
                href="https://vorex.dev/docs/seller-api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 text-sm"
              >
                <FileText className="h-4 w-4" /> Full API Documentation
              </a>
            </div>
          </Card>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" /> API Usage Stats
              </h2>
              
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-semibold">{stats.totalRequests.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-semibold">
                      {stats.totalRequests > 0 
                        ? `${((stats.totalErrors / stats.totalRequests) * 100).toFixed(1)}%` 
                        : "0%"}
                    </p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <p className="text-sm text-muted-foreground">Last API Call</p>
                    <p className="text-lg font-medium">
                      {stats.lastUsed 
                        ? formatDate(stats.lastUsed)
                        : "Never"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-center">
                  <div>
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No usage data available yet.</p>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Recent API Calls
              </h2>
              
              {historyLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : history.length > 0 ? (
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-2 font-medium">Endpoint</th>
                        <th className="text-left py-2 font-medium">Status</th>
                        <th className="text-left py-2 font-medium">Time</th>
                        <th className="text-left py-2 font-medium">Response Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.slice(0, 5).map((entry) => (
                        <tr key={entry.id} className="border-b last:border-0">
                          <td className="py-2 pr-4">
                            <div className="font-mono text-xs">{entry.endpoint}</div>
                          </td>
                          <td className="py-2 pr-4">
                            <span className={getStatusColor(entry.status)}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="py-2 pr-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{new Date(entry.timestamp).toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="py-2">
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3 text-muted-foreground" />
                              <span>{entry.responseTime}ms</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-center">
                  <div>
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">No API calls made yet.</p>
                  </div>
                </div>
              )}
              
              {history.length > 5 && (
                <div className="mt-4 text-center">
                  <Button variant="link" className="text-xs">
                    View All API Calls
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Simple Key icon component
function Key(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
} 