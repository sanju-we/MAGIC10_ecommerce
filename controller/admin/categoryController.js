const Category = require('../../models/categorySchema')
const Product = require('../../models/productSchema')

const categoryInfo = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 4
    const skip = (page - 1) * limit

    const categoryData = await Category.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalCategories = await Category.countDocuments()
    const totalPages = Math.ceil(totalCategories / limit)
    res.render('category', {
      categories: categoryData,
      currentPage: page,
      totalPages: totalPages,
      totalCategories: totalCategories
    })
  } catch (error) {
    console.error('error in category page', error)
    res.redirect('/pageerror')
  }
}

const addCategory = async (req, res) => {
  const { name, description } = req.body;
  console.log(name, description);
  try {
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ success: false, error: "Category already exists" }); 
    }
    const newCategory = new Category({
      name,
      description,
    });
    await newCategory.save();
    return res.json({ success: true, message: "Category added successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const addCategoryOffer = async (req, res) => {
  try {
    const percentage = parseInt(req.body.percentage);
    const categoryId = req.body.categoryId;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ status: false, message: 'Category not found' });
    }

    const products = await Product.find({ category: category._id });
    const hasproductOffer = products.some((product) => product.productOffer > percentage);

    if (hasproductOffer) {
      return res.json({ status: false, message: 'Product with this category already has product offers' });
    }

    await Category.updateOne({ _id: categoryId }, { $set: { categoryOffer: percentage } });

    for (const product of products) {
      product.productOffer = 0;
      product.salePrice = product.regularPrice;
      await product.save();
    }

    res.json({ status: true, message: 'Category offer added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

const removeCategoryOffer = async (req, res) => {
  try {
    const { categoryId } = req.body;
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ status: false, message: 'Category not found' });
    }

    
    await Category.updateOne({ _id: categoryId }, { $unset: { categoryOffer: 1 } });

    
    const products = await Product.find({ category: category._id });
    for (const product of products) {
      product.productOffer = 0;
      product.salePrice = product.regularPrice;
      await product.save();
    }

    res.json({ status: true, message: 'Category offer removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
};

const getListCategory = async(req,res)=>{
  try {
    let id = req.query.id
    await Category.updateOne({_id:id},{$set:{isListed:true}})
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to list category' })
  }
}

const getUnlistCategory = async (req, res) => {
  try {
      let id = req.query.id;
      await Category.updateOne({ _id: id }, { $set: { isListed: false } });
      res.json({ success: true });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to unlist category' });
  }
};

const editCategory = async (req, res) => {
  try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!name || !description) {
          return res.status(400).json({ success: false, message: 'Name and description are required' });
      }

      const updatedCategory = await Category.findByIdAndUpdate(
          id,
          { $set: { name, description } },
          { new: true }
      );

      if (!updatedCategory) {
          return res.status(404).json({ success: false, message: 'Category not found' });
      }

      res.json({ success: true, message: 'Category updated successfully', category: updatedCategory });
  } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

const editCategoryOffer = async (req, res) => {
  try {
      const { categoryId, percentage } = req.body;

      if (!categoryId || !percentage) {
          return res.status(400).json({ status: false, message: 'Category ID and percentage are required' });
      }

      if (percentage < 1 || percentage > 99) {
          return res.status(400).json({ status: false, message: 'Percentage must be between 1 and 99' });
      }

      const category = await Category.findById(categoryId);
      if (!category) {
          return res.status(404).json({ status: false, message: 'Category not found' });
      }

      category.offer = percentage;
      await category.save();

      res.json({ status: true, message: 'Offer updated successfully', category });
  } catch (error) {
      console.error('Error updating category offer:', error);
      res.status(500).json({ status: false, message: 'Failed to update offer' });
  }
};

const deleteCategory = async (req, res) => {
  try {
      const { categoryId } = req.params;

      if (!categoryId) {
          return res.status(400).json({ success: false, message: 'Category ID is required' });
      }

      const deletedCategory = await Category.findByIdAndDelete(categoryId);

      if (!deletedCategory) {
          return res.status(404).json({ success: false, message: 'Category not found' });
      }

      res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};







module.exports = {
  categoryInfo,
  addCategory,
  addCategoryOffer,
  removeCategoryOffer,
  getListCategory,
  getUnlistCategory,
  editCategory,
  editCategoryOffer,
  deleteCategory
}