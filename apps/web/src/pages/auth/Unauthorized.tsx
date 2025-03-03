import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="absolute top-4 left-4">
        <Logo size="md" />
      </div>
      <h1 className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
        Unauthorized Access
      </h1>
      <p className="mt-4 text-lg" style={{ color: 'hsl(var(--muted-foreground))' }}>
        You do not have permission to view this page.
      </p>
      <Link to="/">
      <Button
        className="mt-6 px-4 py-2  transition duration-200"
        variant="default"
      >
          Go back to Home
      </Button>
      </Link>

    </div>
  );
};

export default Unauthorized; 