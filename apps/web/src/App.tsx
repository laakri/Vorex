import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import "./App.css";
import { Button } from "@/components/ui/button";

function App() {
  // return <RouterProvider router={router} />;
  return (
    <div>
      <Button>Click me</Button>
    </div>
  );
}

export default App;
