/**
 * Blog Content Loader Utility
 * 
 * This utility provides functions to load blog post content from dedicated files,
 * improving performance by not loading all blog content at once in blogData.ts
 */

import { blogPosts } from './blogData';

// Import blog content
import { content as firebasics101Content } from './blogPost-fire-basics-101';
import { content as investmentstrategies2023Content } from './blogPost-investment-strategies-2023';
import { content as taxoptimizationearlyretirementContent } from './blogPost-tax-optimization-early-retirement';
import { content as realestatefirejourneyContent } from './blogPost-real-estate-fire-journey';
import { content as budgetoptimizationfireContent } from './blogPost-budget-optimization-fire';
import { content as passiveincomefireContent } from './blogPost-passive-income-fire';
import { content as psychologyfinancialindependenceContent } from './blogPost-psychology-financial-independence';
import { content as internationalfireContent } from './blogPost-international-fire';
import { content as coastfireapproachContent } from './blogPost-coast-fire-approach';
import { content as healthcareearlyretirementContent } from './blogPost-healthcare-early-retirement';
import { content as dynamicwithdrawalstrategiesContent } from './blogPost-dynamic-withdrawal-strategies';
import { content as inflationprotectionfireContent } from './blogPost-inflation-protection-fire';

/**
 * Map of blog post IDs to their content
 * Add new blog posts here as they are created
 */
const blogContentMap: Record<string, string> = {
  'fire-basics-101': firebasics101Content,
  'investment-strategies-2023': investmentstrategies2023Content,
  'tax-optimization-early-retirement': taxoptimizationearlyretirementContent,
  'real-estate-fire-journey': realestatefirejourneyContent,
  'budget-optimization-fire': budgetoptimizationfireContent,
  'passive-income-fire': passiveincomefireContent,
  'psychology-financial-independence': psychologyfinancialindependenceContent,
  'international-fire': internationalfireContent,
  'coast-fire-approach': coastfireapproachContent,
  'healthcare-early-retirement': healthcareearlyretirementContent,
  'dynamic-withdrawal-strategies': dynamicwithdrawalstrategiesContent,
  'inflation-protection-fire': inflationprotectionfireContent,
};

/**
 * Get content for a specific blog post by ID
 * @param id - The blog post ID
 * @returns The blog post content or null if not found
 */
export function getBlogPostContent(id: string): string | null {
  return blogContentMap[id] || null;
}

/**
 * Check if a blog post has content available
 * @param id - The blog post ID
 * @returns True if content is available, false otherwise
 */
export function hasBlogPostContent(id: string): boolean {
  return id in blogContentMap;
}

/**
 * Get a blog post with its content
 * @param id - The blog post ID
 * @returns The blog post with content or null if not found
 */
export function getBlogPostWithContent(id: string) {
  const post = blogPosts.find(post => post.id === id);
  if (!post) return null;

  const content = getBlogPostContent(id);
  if (!content) return { ...post, content: null };

  return { ...post, content };
} 