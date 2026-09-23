<template>
  <div class="bg-white p-6 rounded-xl shadow-md">
    <h2 class="text-xl font-bold mb-4 text-gray-800">Tambah Produk</h2>
    
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Nama Produk</label>
        <input 
          v-model="name" 
          type="text" 
          placeholder="Contoh: Kopi Susu" 
          class="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700">Harga (Rp)</label>
          <input 
            v-model.number="price" 
            type="number" 
            class="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Kategori</label>
          <select 
            v-model="category" 
            class="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Kopi">Kopi</option>
            <option value="Makanan">Makanan</option>
            <option value="Non-Kopi">Non-Kopi</option>
          </select>
        </div>
      </div>

      <button 
        type="submit" 
        class="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        + Simpan Produk
      </button>
    </form>
  </div>
</template>