<template>
  <main class="bg-surface flex flex-col overflow-y-auto min-h-screen">
    <div
      class="flex-1 flex flex-col justify-center px-6 pt-12 pb-[52px] max-w-[600px] mx-auto w-full md:px-10 xl:px-[52px]"
    >
      <AppBrand />

      <slot />
    </div>
  </main>
</template>

<style scoped></style>
