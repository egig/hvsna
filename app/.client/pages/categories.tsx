import { useEffect, useState } from "react";
import { Icon, List, ListItem, Navbar, NavTitle, Page, Preloader, Block, Button, Popup, NavRight, Link, f7 } from "framework7-react";
import { useCategory } from "../hooks/useCategory";
import { Plus, Tag } from "lucide-react";
import type { Category } from "~/lib/tracker/types";
import CategoryForm from "../components/category-form";

export default function Categories() {
  const { loading, error, deleteCategory, getCategories } = useCategory();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popupOpened, setPopupOpened] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const resetForm = () => {
    setEditingCategoryId(null);
  };

  const openAddPopup = () => {
    setEditingCategoryId(null);
    setTimeout(() => setPopupOpened(true), 0);
  };

  const openEditPopup = (category: Category) => {
    setEditingCategoryId(category.id);
    setPopupOpened(true);
  };

  const closePopup = () => {
    setPopupOpened(false);
  };

  useEffect(() => {
    if (!popupOpened) {
      resetForm();
    }
  }, [popupOpened]);

  const handleCategorySuccess = () => {
    setPopupOpened(false);
    loadData();
  };

  const handleCategoryError = (errorMessage: string) => {
    f7.dialog.alert(errorMessage);
  };

  const handleCategoryCancel = () => {
    setPopupOpened(false);
  };

  const handleDeleteCategory = async (category: Category) => {
    f7.dialog.confirm(
      `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`,
      'Delete Category',
      async () => {
        try {
          await deleteCategory(category.id);
          loadData();
        } catch (err) {
          console.error('Failed to delete category:', err);
          f7.dialog.alert('Failed to delete category. Please try again.');
        }
      }
    );
  };

  const formatCreatedDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Page>
      <Navbar backLink>
        <NavTitle>Categories</NavTitle>
        <NavRight>
          <Link onClick={openAddPopup}>
            <Plus />
          </Link>
        </NavRight>
      </Navbar>
      
      {loading && (
        <Block className="text-center">
          <Preloader />
          <div>Loading categories...</div>
        </Block>
      )}

      {error && (
        <Block className="text-center">
          <div style={{ color: 'red' }}>Error: {error}</div>
          <Button fill onClick={loadData}>
            <Icon ios="f7:arrow_clockwise" md="material:refresh" />
            Retry
          </Button>
        </Block>
      )}

      {!loading && !error && categories.length === 0 && (
        <Block className="text-center">
          <Tag size={48} />
          <p>No categories yet</p>
          <p>Create your first category to organize your metrics and logs!</p>
          <Button fill onClick={openAddPopup}>
            <Plus size={16} />
            Create Category
          </Button>
        </Block>
      )}

      {!loading && !error && categories.length > 0 && (
        <List mediaList>
          {categories.map((category) => (
            <ListItem
              key={category.id}
              title={category.name}
              swipeout
            >
              <div slot="root-end" className="swipeout-actions-right">
                <a 
                  href="#" 
                  className="swipeout-delete"
                  onClick={() => handleDeleteCategory(category)}
                >
                  Delete
                </a>
              </div>
              <div slot="media">
                <Tag size={24} className="text-purple-500" />
              </div>
              <div slot="root" onClick={() => openEditPopup(category)} style={{ cursor: 'pointer' }}>
                <div className="text-xs text-gray-500 margin-top">
                  Created: {formatCreatedDate(category.createdAt)}
                </div>
              </div>
            </ListItem>
          ))}
        </List>
      )}

      <Popup 
        opened={popupOpened} 
        onPopupClose={closePopup}
        backdrop
        closeOnEscape
      >
        <Page>
          <Navbar>
            <NavTitle>{editingCategoryId ? "Edit Category" : "New Category"}</NavTitle>
            <NavRight>
              <Link onClick={closePopup}>Done</Link>
            </NavRight>
          </Navbar>
          
          <CategoryForm
            categoryId={editingCategoryId}
            onSuccess={handleCategorySuccess}
            onError={handleCategoryError}
            onCancel={handleCategoryCancel}
          />
        </Page>
      </Popup>
    </Page>
  );
}
