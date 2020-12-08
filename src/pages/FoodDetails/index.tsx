import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  thumbnail_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;
  const { id: foodId } = routeParams;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      try {
        const { data: apiFood } = await api.get<Food>(`foods/${foodId}`);
        const { data: favorites } = await api.get<Food[]>('/favorites');
        const { price, extras: foodExtras } = apiFood;

        const formattedPrice = formatValue(price);

        const initialExtrasValue = foodExtras.map(extra => ({
          ...extra,
          quantity: 0,
        }));

        const loadedFood = {
          ...apiFood,
          formattedPrice,
          extras: initialExtrasValue,
        };

        const foodIsFavorite = favorites.find(
          favorite => favorite.id === foodId,
        );

        if (foodIsFavorite) {
          setIsFavorite(true);
        }

        setFood(loadedFood);
        setExtras(initialExtrasValue);
      } catch (err) {
        console.log(err);
      }
    }

    loadFood();
  }, [foodId]);

  const handleIncrementExtra = useCallback(
    (id: number): void => {
      const updatedExtras = extras.map(extra => {
        if (extra.id !== id) return extra;

        const { quantity } = extra;
        const updatedQuantity = quantity + 1;

        return { ...extra, quantity: updatedQuantity };
      });

      setExtras(updatedExtras);
    },
    [extras],
  );

  const handleDecrementExtra = useCallback(
    (id: number): void => {
      const updatedExtras = extras.map(extra => {
        if (extra.id !== id) return extra;

        const { quantity } = extra;

        const updatedQuantity = quantity - 1;

        if (updatedQuantity < 0) {
          return extra;
        }

        return { ...extra, quantity: updatedQuantity };
      });

      setExtras(updatedExtras);
    },
    [extras],
  );

  const handleIncrementFood = useCallback((): void => {
    setFoodQuantity(oldQuantity => oldQuantity + 1);
  }, []);

  const handleDecrementFood = useCallback((): void => {
    setFoodQuantity(oldQuantity => {
      const possibleNewQuantity = oldQuantity - 1;

      if (possibleNewQuantity >= 1) return possibleNewQuantity;

      return oldQuantity;
    });
  }, []);

  const toggleFavorite = useCallback(async () => {
    const {
      name,
      description,
      price,
      category,
      image_url,
      thumbnail_url,
      id,
    } = food;

    if (isFavorite) {
      await api.delete(`/favorites/${id}`);
      setIsFavorite(false);
      return;
    }

    const foodToFavorite = {
      name,
      description,
      price,
      category,
      image_url,
      thumbnail_url,
      id,
    };

    await api.post('favorites', foodToFavorite);
    setIsFavorite(true);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const foodTotal = foodQuantity * food.price;

    const extrasTotal = extras.reduce((acc, extra) => {
      return acc + extra.value * extra.quantity;
    }, 0);

    const total = foodTotal + extrasTotal;

    const formattedTotal = formatValue(total);

    return formattedTotal;
  }, [extras, food, foodQuantity]);

  const handleFinishOrder = useCallback(async (): Promise<void> => {
    const {
      name,
      description,
      price,
      category,
      thumbnail_url,
      id: product_id,
    } = food;

    const extrasAdded = extras.filter(extra => !!extra.quantity);

    const orderToAdd = {
      name,
      description,
      price,
      category,
      thumbnail_url,
      product_id,
      quantity: foodQuantity,
      extras: extrasAdded,
    };

    await api.post('/orders', orderToAdd);

    navigation.reset({
      routes: [{ name: 'MainBottom' }],
      index: 0,
      routeNames: ['Dashboard'],
    });
  }, [food, extras, foodQuantity, navigation]);

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
