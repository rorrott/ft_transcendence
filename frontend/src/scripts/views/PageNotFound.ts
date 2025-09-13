export class PageNotFoundView {
  async getHtml() {
		return `
      <section class="flex flex-col items-center justify-center text-center p-10">
        <h2 class="text-3xl font-bold text-red-600">404 - Page Not Found</h2>
        <p class="mt-4 text-gray-700">Oops! The page you're looking for doesn't exist.</p>
        </section>
        `;
      }
}