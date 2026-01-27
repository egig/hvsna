import { useState, useEffect } from "react";
import { Block, BlockTitle, ListInput, List, ListButton, Preloader } from "framework7-react";
import { useCategory } from "../hooks/useCategory";
import type { Category } from "~/lib/tracker/types";

interface CategoryFormProps {
  categoryId?: string | null;
  onSuccess?: (category: Category) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export default function CategoryForm({
  categoryId,
  onSuccess,
  onError,
  onCancel,
}: CategoryFormProps) {
  const { loading, error, createCategory, updateCategory, getCategory } = useCategory();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (categoryId) {
      getCategory(categoryId).then((fetchedCategory: Category) => {
        if (fetchedCategory) {
          setName(fetchedCategory.name);
        }
      }).catch(() => {
        // Handle error silently
      });
    } else {
      setName('');
    }
  }, [categoryId, getCategory]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      
      let result: Category;
      if (categoryId) {
        result = await updateCategory(categoryId, {
          name: name.trim()
        });
      } else {
        result = await createCategory({
          name: name.trim()
        });
      }

      // Reset form
      setName('');
      
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      // Error is handled by the hook and passed through onError
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName('');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Block>
      <BlockTitle color="primary">{categoryId ? "Edit Category" : "New Category"}</BlockTitle>
      {loading && <div className="text-center"><Preloader /></div>}
      <List strong dividers>
        <ListInput 
          outline 
          type="text" 
          value={name} 
          placeholder="Enter category name" 
          onChange={(e: any) => setName(e.target.value)} 
          readonly={isSubmitting}
          label="Name"
        />
        <div className="display-flex justify-content-space-between padding-horizontal">
          <ListButton onClick={handleCancel} className={isSubmitting ? 'disabled' : ''}>CANCEL</ListButton>
          <ListButton color="primary" onClick={handleSubmit} className={(isSubmitting || !name.trim()) ? 'disabled' : ''}>
            {isSubmitting ? (
              <><Preloader size={16} /> {categoryId ? "UPDATING..." : "CREATING..."}</>
            ) : (
              categoryId ? "UPDATE" : "CREATE"
            )}
          </ListButton>
        </div>
      </List>
    </Block>
  );
}
