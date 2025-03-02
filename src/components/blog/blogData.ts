// Define blog topic type
export type BlogTopic = 
  | 'Investing' 
  | 'Savings' 
  | 'Retirement Planning' 
  | 'Tax Optimization' 
  | 'Early Retirement' 
  | 'Financial Independence'
  | 'Passive Income'
  | 'Real Estate'
  | 'Budget'
  | 'Lifestyle';

// Define blog post type
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  topics: BlogTopic[];
  image?: string;
  readTime: number; // in minutes
}

// Sample blog posts data
export const blogPosts: BlogPost[] = [
  {
    id: 'fire-basics-101',
    title: 'The Fundamentals of FIRE: Your Path to Financial Independence',
    excerpt: 'Discover the core principles of the FIRE movement and how you can start your journey to financial independence and early retirement.',
    date: '2024-04-15',
    author: 'Emma Richardson',
    topics: ['Financial Independence', 'Early Retirement', 'Savings'],
    image: 'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    readTime: 8
  },
  {
    id: 'investment-strategies-2023',
    title: 'Investment Strategies for Building Your FIRE Portfolio',
    excerpt: 'Explore effective investment approaches that can help accelerate your path to financial independence while managing risk.',
    date: '2023-11-20',
    author: 'Michael Chen',
    topics: ['Investing', 'Financial Independence', 'Retirement Planning'],
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    readTime: 12
  },
  {
    id: 'tax-optimization-early-retirement',
    title: 'Tax Optimization Strategies for Early Retirees',
    excerpt: 'Learn how to structure your investments and withdrawals to minimize tax burden during your early retirement years.',
    date: '2023-10-05',
    author: 'Sarah Johnson',
    topics: ['Tax Optimization', 'Early Retirement', 'Retirement Planning'],
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    readTime: 10
  },
  {
    id: 'passive-income-fire',
    title: 'Building Passive Income Streams for FIRE',
    excerpt: 'Discover various passive income opportunities that can supplement your investment returns and accelerate your journey to financial independence.',
    date: '2023-09-12',
    author: 'David Wong',
    topics: ['Passive Income', 'Financial Independence', 'Investing'],
    image: 'https://images.unsplash.com/photo-1607863680198-23d4b2565df0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    readTime: 9
  },
  {
    id: 'real-estate-fire-journey',
    title: 'How Real Estate Can Accelerate Your FIRE Journey',
    excerpt: 'Explore the benefits and challenges of incorporating real estate investments into your financial independence strategy.',
    date: '2023-08-28',
    author: 'Jennifer Martinez',
    topics: ['Real Estate', 'Passive Income', 'Financial Independence'],
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    readTime: 11
  },
  {
    id: 'budget-optimization-fire',
    title: 'Optimizing Your Budget for Maximum Savings Rate',
    excerpt: 'Learn practical strategies to increase your savings rate without sacrificing quality of life, helping you reach FIRE faster.',
    date: '2023-07-15',
    author: 'Thomas Black',
    topics: ['Budget', 'Savings', 'Lifestyle'],
    image: 'https://images.unsplash.com/photo-1554224154-22dec7ec8818?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    readTime: 7
  },
  {
    id: 'coast-fire-approach',
    title: 'Coast FIRE: An Alternative Approach to Financial Independence',
    excerpt: 'Understand the concept of Coast FIRE and how it might be the right balance between early saving and lifestyle for many people.',
    date: '2023-06-20',
    author: 'Olivia Parker',
    topics: ['Financial Independence', 'Retirement Planning', 'Lifestyle'],
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    readTime: 8
  },
  {
    id: 'psychology-financial-independence',
    title: 'The Psychology of Financial Independence',
    excerpt: 'Explore the mental and emotional aspects of pursuing FIRE, including motivation, burnout prevention, and finding purpose.',
    date: '2023-05-10',
    author: 'Ryan Miller',
    topics: ['Financial Independence', 'Lifestyle', 'Early Retirement'],
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    readTime: 9
  },
  {
    id: 'international-fire',
    title: 'Geographic Arbitrage: FIRE in International Settings',
    excerpt: 'Discover how living abroad in lower-cost areas can dramatically accelerate your path to financial independence.',
    date: '2023-04-22',
    author: 'Emily Chang',
    topics: ['Financial Independence', 'Lifestyle', 'Early Retirement'],
    image: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    readTime: 10
  }
]; 