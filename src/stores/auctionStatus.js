import { readonly, ref } from "vue";
const currentPlayer = ref(null);
const auctionStatus = ref(null);

//TODO mantenere stato del giocatore in asta senza doverlo richiedere

export function useAuctionStatus() {

  const setAuctionStatus = (newAuctionStatus) => {
    auctionStatus.value = newAuctionStatus;
  };

  const updateAuctionBestOffer = (offer) => {
    auctionStatus.value.bestOffer = offer;
  };


  const clearAuctionStatus = () => {
    auctionStatus.value = null;
  };

  const setCurrentPlayer = (player) => {
    currentPlayer.value = player;
  };

  const clearPlayer = () => {
    currentPlayer.value = null;
  };

  return {
    auctionStatus: readonly(auctionStatus),
    setAuctionStatus,
    updateAuctionBestOffer,
    clearAuctionStatus,
    currentPlayer: readonly(currentPlayer),
    setCurrentPlayer,
    clearPlayer,
  };
}
