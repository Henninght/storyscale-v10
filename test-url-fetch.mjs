import { fetchMultipleUrls } from './lib/urlFetcher.ts';

const urls = [
  'https://portkey.ai/blog/claude-sonnet-4-5-vs-gpt-5/',
  'https://blog.getbind.co/2025/09/30/claude-sonnet-4-5-vs-gpt-5-vs-claude-opus-4-1-ultimate-coding-comparison/'
];

const results = await fetchMultipleUrls(urls);

results.forEach((result, i) => {
  console.log(`\n===== URL ${i+1}: ${result.url} =====`);
  if (result.error) {
    console.log('ERROR:', result.error);
  } else {
    console.log('Content length:', result.content.length);
    console.log('\nFirst 1000 chars:');
    console.log(result.content.substring(0, 1000));
    console.log('\n...');
  }
});
