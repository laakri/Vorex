import { AddProductModal } from "./add-product-modal";
import { Product } from "./products";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function EditProductModal({ isOpen, onClose, product }: EditProductModalProps) {
  if (!product) return null;
  
  return (
    <AddProductModal 
      isOpen={isOpen} 
      onClose={onClose}
      initialData={{
        ...product,
        weight: product.weight.toString()
      }}
      mode="edit"
    />
  );
} 