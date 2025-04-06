import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FoodCard from './FoodCard.vue';
import type { FoodInfo } from '@/types/food';
// Remove direct import of Element Plus components
// import { ElRate, ElTag } from 'element-plus';

// Mock data for a food item
const mockFood: FoodInfo = {
    id: 101,
    name: '测试美味汉堡',
    coverImage: '/mock/images/burger.jpg',
    category: 'western',
    rating: 4.5,
    price: 55,
    tags: ['热门', '牛肉']
};

describe('FoodCard.vue', () => {
    it('renders food name correctly', () => {
        const wrapper = mount(FoodCard, {
            props: { food: mockFood }
        });
        // Updated selector
        const nameElement = wrapper.find('span.name');
        expect(nameElement.exists()).toBe(true);
        expect(nameElement.text()).toBe(mockFood.name);
    });

    it('renders food price correctly', () => {
        const wrapper = mount(FoodCard, {
            props: { food: mockFood }
        });
        // Updated selector
        const priceElement = wrapper.find('span.price');
        expect(priceElement.exists()).toBe(true);
        // Price text includes the currency symbol
        expect(priceElement.text()).toBe(`¥${mockFood.price}`);
    });

    it('renders food rating correctly when rating exists', () => {
        const wrapper = mount(FoodCard, {
            props: { food: mockFood },
            global: {
                // Use simple stubs
                stubs: {
                    ElRate: true,
                    ElTag: true
                }
            }
        });
        // Check if the el-rate-stub element exists (rendered because rating exists)
        expect(wrapper.find('el-rate-stub').exists()).toBe(true);
        // Check if the no-rating element does NOT exist
        expect(wrapper.find('.no-rating').exists()).toBe(false);
    });

    it('renders "no rating" text when rating is undefined', () => {
        const foodWithoutRating = { ...mockFood, rating: undefined };
        const wrapper = mount(FoodCard, {
            props: { food: foodWithoutRating },
            global: {
                stubs: {
                    ElRate: true,
                    ElTag: true
                }
            }
        });
        // Check if the el-rate-stub element does NOT exist (not rendered because rating is undefined)
        expect(wrapper.find('el-rate-stub').exists()).toBe(false);
        // Check if the no-rating element DOES exist
        const noRatingElement = wrapper.find('.no-rating');
        expect(noRatingElement.exists()).toBe(true);
        expect(noRatingElement.text()).toBe('暂无评分');
    });

    it('renders the food image with correct src', () => {
        const wrapper = mount(FoodCard, {
            props: { food: mockFood }
        });
        // Updated selector
        const imgElement = wrapper.find('img.image');
        expect(imgElement.exists()).toBe(true);
        expect(imgElement.attributes('src')).toBe(mockFood.coverImage);
        expect(imgElement.attributes('alt')).toBe(mockFood.name);
    });

    it('renders tags when tags exist', () => {
        const wrapper = mount(FoodCard, {
            props: { food: mockFood },
            global: {
                stubs: {
                    'el-rate': true,
                    ElTag: true // Stub el-tag
                }
            }
        });
        // Find stubbed ElTag components
        const tagStubs = wrapper.findAllComponents({ name: 'ElTag' });
        expect(tagStubs.length).toBe(mockFood.tags?.length);
        // Check props or content passed to stubs if necessary
        // For basic check, just ensuring count is correct is often enough
        // expect(tagStubs[0].text()).toBe(mockFood.tags![0]); // Stubs might not have text
    });

    it('does not render tags section when tags are empty or undefined', () => {
        const foodWithoutTags = { ...mockFood, tags: [] };
        const wrapper = mount(FoodCard, {
            props: { food: foodWithoutTags }
        });
        // Updated selector for the container
        const tagsSection = wrapper.find('div.tags');
        expect(tagsSection.exists()).toBe(false);

        const foodWithUndefinedTags = { ...mockFood, tags: undefined };
        const wrapper2 = mount(FoodCard, {
            props: { food: foodWithUndefinedTags }
        });
        const tagsSection2 = wrapper2.find('div.tags');
        expect(tagsSection2.exists()).toBe(false);
    });
}); 