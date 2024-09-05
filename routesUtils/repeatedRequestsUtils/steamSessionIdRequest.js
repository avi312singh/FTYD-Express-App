import axios from 'axios';

const steamSessionIdRequest = async (sessionId) => {
  try {
    const response = await axios.get(`https://steamcommunity.com/my`, {
      headers: {
        Cookie: `sessionid=${sessionId}`,
      },
    });

    console.log('Successfully fetched Steam session ID page');
    return response.data;
  } catch (error) {
    console.error('Error fetching Steam session ID:', error.message);
    throw new Error('Failed to fetch Steam session ID');
  }
};

export default steamSessionIdRequest;
