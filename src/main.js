import axios from 'axios';
import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const input = document.getElementById('search-input');
const galleryEl = document.getElementById('gallery');
const loaderEl = document.getElementById('loader');
const loadMoreBtn = document.getElementById('load-more');

let currentPage = 1;
let currentQuery = '';

let lightbox = new SimpleLightbox('.gallery a', { captionsData: 'alt', captionDelay: 250 });

function showLoader() {
  loaderEl.classList.remove('is-hidden');
  loaderEl.setAttribute('aria-hidden', 'false');
}

function hideLoader() {
  loaderEl.classList.add('is-hidden');
  loaderEl.setAttribute('aria-hidden', 'true');
}

function clearGallery() {
  galleryEl.innerHTML = '';
}

function createCardMarkup(image) {
  return `
    <li class="card">
      <a class="card__link" href="${image.largeImageURL}">
        <img class="card__thumb" src="${image.webformatURL}" alt="${escapeHtml(image.tags)}" loading="lazy" />
      </a>
      <div class="card__stats">
        <span title="Beğeniler">❤️ ${image.likes}</span>
        <span title="Gösterimler">👁 ${image.views}</span>
        <span title="Yorumlar">💬 ${image.comments}</span>
        <span title="İndirilenler">⬇ ${image.downloads}</span>
      </div>
    </li>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>\"']/g, (s) => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":"&#39;"
  }[s]));
}

async function fetchImages(query, page = 1) {
  const params = {
    key: '52761827-accd899221d475ff75a0f470c',
    q: query,
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    per_page: 40,
    page: page,
  };

  try {
    const response = await axios.get('https://pixabay.com/api/', { params });
    return response.data;
  } catch (error) {
    throw new Error('An error occurred while fetching the images.');
  }
}

const form = document.getElementById('search-form');

form.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  currentQuery = query;
  currentPage = 1; // Reset page on new search
  clearGallery();
  showLoader();
  loadMoreBtn.classList.add('is-hidden'); // Hide "Load more" on new search

  try {
    const data = await fetchImages(query, currentPage);
    const hits = data.hits ?? [];

    if (!Array.isArray(hits) || hits.length === 0) {
      iziToast.warning({
        title: 'Uyarı',
        message: "Sorry, there are no images matching your search query. Please try again!",
        position: 'topRight',
      });
      return;
    }

    const markup = hits.map(createCardMarkup).join('');
    galleryEl.insertAdjacentHTML('beforeend', markup);
    lightbox.refresh();

    if (data.totalHits > hits.length) {
      loadMoreBtn.classList.remove('is-hidden');
    }
  } catch (error) {
    console.error(error);
    iziToast.error({
      title: 'Hata',
      message: 'An error occurred during the request. Check the console.',
      position: 'topRight',
    });
  } finally {
    hideLoader();
  }
});

loadMoreBtn.addEventListener('click', async () => {
  currentPage += 1;
  showLoader();

  try {
    const data = await fetchImages(currentQuery, currentPage);
    const hits = data.hits ?? [];

    if (hits.length === 0) {
      iziToast.info({
        title: 'Bilgi',
        message: "You have reached the end of the search results.",
        position: 'topRight',
      });
      loadMoreBtn.classList.add('is-hidden');
      return;
    }

    const markup = hits.map(createCardMarkup).join('');
    galleryEl.insertAdjacentHTML('beforeend', markup);
    lightbox.refresh();

    if (data.totalHits <= currentPage * 40) {
      loadMoreBtn.classList.add('is-hidden');
    }

    window.scrollBy(0, galleryEl.querySelector('li').getBoundingClientRect().height * 2); // Scroll down after loading more
  } catch (error) {
    console.error(error);
    iziToast.error({
      title: 'Hata',
      message: 'An error occurred while loading more images.',
      position: 'topRight',
    });
  } finally {
    hideLoader();
  }
});
