import {View, Text, TextInput, Button, Alert} from 'react-native';
import React, {useEffect, useRef, useState} from 'react';
import MapView, {Marker} from 'react-native-maps';
import {
  ConnectWallet,
  useAddress,
  useContract,
  useDisconnect,
  useNFTs,
  useOwnedNFTs,
  Web3Button,
} from '@thirdweb-dev/react-native';
import Geolocation, {
  GeolocationResponse,
} from '@react-native-community/geolocation';
import {calcCrow} from './utils';

const Game = () => {
  const address = useAddress();
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(true);
  const [lat, setLat] = useState<number>(0);
  const [lon, setLon] = useState<number>(0);
  const [tempLat, setTempLat] = useState<string>('');
  const [tempLon, setTempLon] = useState<string>('');
  const [claimEnabled, setClaimEnabeld] = useState<boolean>(false);
  const [tokenId, setTokenId] = useState<string>('');
  const ref = useRef(null);
  const disconnect = useDisconnect();

  const {contract} = useContract(
    '0xa0Ac8eDe81A70b00247e80e797225C2Fec7A8050',
    'custom',
  );

  const {data: nfts, refetch} = useOwnedNFTs(
    contract,
    '0x98393dc763Ec585D41c030506e6aaC61DAfF49C8',
  );
  console.log(nfts);

  useEffect(() => {
    let flag = false;
    nfts?.forEach(async nft => {
      console.log(
        `nft: ${nft.metadata?.attributes![0].value} ${
          nft.metadata?.attributes![1].value
        }`,
      );
      console.log(
        `int: ${parseInt(nft.metadata?.attributes![0].value)} ${parseInt(
          nft.metadata?.attributes![1].value,
        )}`,
      );
      const distance = calcCrow(
        lat,
        lon,
        parseFloat(nft.metadata?.attributes![0].value),
        parseFloat(nft.metadata?.attributes![1].value),
      );
      console.log(distance);
      if (distance <= 1) {
        setClaimEnabeld(true);
        setTokenId(nft.metadata.id);
        flag = true;
      }
    });

    if (!flag) {
      setClaimEnabeld(false);
    }
  }, [nfts, lat, lon]);

  // console.log(nfts[0].metadata.attributes[0].value);

  const success = (position: GeolocationResponse) => {
    if (useCurrentLocation) {
      setLat(position.coords.latitude);
      setLon(position.coords.longitude);
      console.log(position.coords);
      // @ts-ignore
      ref?.current?.animateToRegion({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  useEffect(() => {
    Geolocation.watchPosition(success);
  }, []);

  return (
    <View style={{height: '100%'}}>
      <MapView
        ref={ref}
        style={{flex: 1}}
        initialRegion={{
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}>
        <Marker
          coordinate={{
            latitude: lat,
            longitude: lon,
          }}
        />
        {nfts?.map(nft => (
          <Marker
            key={nft.metadata?.id}
            pinColor="green"
            coordinate={{
              // @ts-ignore
              latitude: parseFloat(nft.metadata?.attributes![0].value),
              // @ts-ignore
              longitude: parseFloat(nft.metadata?.attributes![1].value),
            }}
          />
        ))}
      </MapView>

      <View
        style={{
          height: '30%',
          // display: 'flex',
          // alignItems: 'center',
          // justifyContent: 'center',
          // flexDirection: 'column',
        }}>
        {address ? (
          <>
            <View style={{}}>
              <TextInput
                placeholder="Latitude"
                value={tempLat}
                onChangeText={text => setTempLat(text)}
                style={{borderWidth: 1, borderColor: '#fff'}}
              />
              <TextInput
                placeholder="Longitude"
                value={tempLon}
                onChangeText={text => setTempLon(text)}
                style={{borderWidth: 1, borderColor: '#fff'}}
              />
              <Button
                title="Set Location"
                onPress={() => {
                  setLat(parseFloat(tempLat));
                  setLon(parseFloat(tempLon));
                  setUseCurrentLocation(false);
                }}
              />
              <Button
                title="Current Location"
                onPress={() => {
                  setUseCurrentLocation(true);
                }}
              />
              <Button
                title="Disconnect wallet"
                onPress={() => {
                  disconnect();
                }}
              />
              {claimEnabled && (
                <Web3Button
                  contractAddress="0x98393dc763Ec585D41c030506e6aaC61DAfF49C8"
                  action={async contract => {
                    await contract.call('claim', tokenId);
                    Alert.alert('claimed!');
                    refetch();
                  }}>
                  Claim
                </Web3Button>
              )}
            </View>
          </>
        ) : (
          <ConnectWallet />
        )}
      </View>
    </View>
  );
};

export default Game;
