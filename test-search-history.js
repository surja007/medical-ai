// Test search history functionality
const mongoose = require('mongoose');
const SearchHistory = require('./backend/src/models/SearchHistory');

async function testSearchHistory() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/smart-health-platform');
    console.log('Connected to MongoDB');

    // Test creating a search history entry
    const testSearch = new SearchHistory({
      userId: new mongoose.Types.ObjectId(),
      searchType: 'symptoms',
      query: 'Test headache search',
      searchData: {
        symptoms: [{
          name: 'Headache',
          severity: 7,
          duration: '2 days',
          bodyPart: 'Head'
        }]
      },
      results: {
        count: 1,
        summary: {
          urgencyLevel: 'moderate',
          conditionsCount: 3
        }
      }
    });

    console.log('Attempting to save test search history...');
    await testSearch.save();
    console.log('Test search history saved successfully with ID:', testSearch._id);

    // Test retrieving search history
    const searches = await SearchHistory.find({}).limit(5);
    console.log(`Found ${searches.length} search history entries`);

    // Clean up test entry
    await SearchHistory.deleteOne({ _id: testSearch._id });
    console.log('Test entry cleaned up');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Test failed:', error);
    console.error('Error details:', error.message);
    await mongoose.disconnect();
  }
}

testSearchHistory();