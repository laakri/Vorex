import React, { useState } from 'react';
import Tesseract from 'tesseract.js';
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ImageToText: React.FC<{ onTextExtracted: (text: string) => void }> = ({ onTextExtracted }) => {
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isTextValid, setIsTextValid] = useState<boolean | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImage(file);
      setError(null);
      handleImageUpload(file);
    }
  };

  const handleImageUpload = async (image: File) => {
    if (!image) return;

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const { data: { text } } = await Tesseract.recognize(image, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(m.progress);
          }
        },
      });
      onTextExtracted(text);
      const isValid = validateLicenseText(text);
      setIsTextValid(isValid);
    } catch (err) {
      setError('Error extracting text from image');
    } finally {
      setLoading(false);
    }
  };

  const validateLicenseText = (text: string): boolean => {
    const hasValidKeywords = text.includes("PERMIS DE CONDUIRE") || text.includes("REPUBLIQUE TUNISIENNE");
    const datePattern = /\b\d{2}-\d{2}-\d{4}\b/g;
    const dates = text.match(datePattern) || [];
    return hasValidKeywords && dates.length >= 2;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-4">
      <div className="grid w-full items-center gap-1.5 mb-2">
        <Label htmlFor="picture" className="text-lg font-semibold mb-2">Upload Your Driver's License</Label>
        <Input id="picture" type="file" accept="image/*" onChange={handleImageChange} />
      </div>
      <Button onClick={() => image && handleImageUpload(image)} disabled={loading} className="mb-2 w-full mt-4">
        {loading ? 'Checking License...' : 'Check License'}
      </Button>
      {loading && (
        <div className="mt-4 w-full">
          <Progress value={progress * 100} className="h-2" />
          <p className="text-sm text-muted-foreground">Progress: {Math.round(progress * 100)}%</p>
        </div>
      )}
      {error && <p className="text-red-500">{error}</p>}
      {isTextValid !== null && (
        <div className="mt-2 flex items-center">
          {isTextValid ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-1" />
              <span>Valid License</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <XCircle className="h-5 w-5 mr-1" />
              <span>Invalid License. Please upload a clearer image.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageToText; 